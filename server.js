const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'data', 'jasmine.db');
const uploadsDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

const db = new sqlite3.Database(dbPath);

const ROLE_PERMISSIONS = {
  owner: ['dashboard', 'products', 'orders', 'admins', 'finance'],
  admin: ['dashboard', 'products', 'orders'],
  manager: ['dashboard', 'products', 'orders'],
  support: ['dashboard', 'orders']
};

const ADMIN_DEFAULTS = {
  owner: { username: 'owner', password: 'admin123' },
  admin: { username: 'admin', password: 'admin123' }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));
app.use(session({
  secret: 'jasmine-store-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 12 }
}));

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function parseJson(value, fallback = []) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (err) {
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function normalizePermissions(role, selection = []) {
  const base = ROLE_PERMISSIONS[role] || [];
  const selected = Array.isArray(selection) ? selection : [];
  const merged = new Set([...base, ...selected]);
  return [...merged].filter(Boolean);
}

function jsonString(value) {
  return JSON.stringify(value || []);
}

function handleFlash(req, key = 'flash') {
  const flash = req.session[key];
  req.session[key] = null;
  return flash;
}

function getCart(req) {
  if (!req.session.cart) req.session.cart = {};
  return req.session.cart;
}

function getCartCount(cart) {
  return Object.values(cart || {}).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  return next();
}

function requireAdminPermission(permission) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    const user = req.session.user;
    const role = user.role || 'customer';
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    if (role === 'owner' || permissions.includes(permission) || permissions.includes('dashboard')) return next();
    return res.status(403).render('403', { user: req.session.user, cartCount: getCartCount(getCart(req)) });
  };
}

function extractUser(req) {
  return req.session.user || null;
}

async function ensureDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      permissions TEXT NOT NULL DEFAULT '[]',
      full_name TEXT,
      email TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      active INTEGER DEFAULT 1
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      sizes TEXT DEFAULT '[]',
      colors TEXT DEFAULT '[]',
      images TEXT DEFAULT '[]',
      category TEXT,
      is_hidden INTEGER DEFAULT 0,
      featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      notes TEXT,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      status TEXT NOT NULL DEFAULT 'pending',
      transaction_ref TEXT,
      receipt_image TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      size TEXT,
      color TEXT,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const [role, credentials] of Object.entries(ADMIN_DEFAULTS)) {
    const existing = await get('SELECT id FROM users WHERE username = ?', [credentials.username]);
    if (!existing) {
      const hash = await bcrypt.hash(credentials.password, 10);
      await run(`
        INSERT INTO users (username, password_hash, role, permissions, full_name, active)
        VALUES (?, ?, ?, ?, ?, 1)
      `, [credentials.username, hash, role, jsonString(ROLE_PERMISSIONS[role]), credentials.username.toUpperCase(), 1]);
    }
  }
}

async function increaseStock(productId, quantity) {
  const product = await get('SELECT stock FROM products WHERE id = ?', [productId]);
  if (!product) return;
  await run('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [Math.max(0, Number(product.stock) + Number(quantity)), productId]);
}

async function getVisibleProducts() {
  return all('SELECT * FROM products WHERE is_hidden = 0 ORDER BY created_at DESC');
}

async function getAllProducts() {
  return all('SELECT * FROM products ORDER BY created_at DESC');
}

async function getProductById(id) {
  return get('SELECT * FROM products WHERE id = ?', [id]);
}

async function getUserByUsername(username) {
  return get('SELECT * FROM users WHERE username = ?', [username]);
}

async function getAllAdmins() {
  return all('SELECT * FROM users WHERE role != "customer" ORDER BY created_at DESC');
}

async function getAdminOrders() {
  return all(`
    SELECT o.*, u.username AS customer_username
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
  `);
}

async function getOrderItems(orderId) {
  return all('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
}

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.cartCount = getCartCount(req.session.cart || {});
  res.locals.flash = handleFlash(req);
  next();
});

app.get('/', async (req, res) => {
  const products = await getVisibleProducts();
  res.render('home', { products, user: req.session.user, cartCount: getCartCount(getCart(req)) });
});

app.get('/product/:id', async (req, res) => {
  const product = await getProductById(req.params.id);
  if (!product) return res.status(404).send('Product not found');
  res.render('product', {
    product,
    sizes: parseJson(product.sizes),
    colors: parseJson(product.colors),
    images: parseJson(product.images),
    user: req.session.user,
    cartCount: getCartCount(getCart(req))
  });
});

app.get('/login', (req, res) => {
  res.render('login', { user: req.session.user, cartCount: getCartCount(getCart(req)) });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await getUserByUsername(username.trim());
  if (!user) {
    req.session.flash = { type: 'error', message: 'اسم المستخدم غير موجود.' };
    return res.redirect('/login');
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    req.session.flash = { type: 'error', message: 'كلمة المرور غير صحيحة.' };
    return res.redirect('/login');
  }
  if (user.role !== 'customer' && Number(user.active) !== 1) {
    req.session.flash = { type: 'error', message: 'هذا الحساب غير مفعل.' };
    return res.redirect('/login');
  }
  req.session.user = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    permissions: JSON.parse(user.permissions || '[]')
  };
  req.session.flash = { type: 'success', message: 'تم تسجيل الدخول بنجاح.' };
  const redirectTo = req.session.returnTo || '/';
  req.session.returnTo = null;
  res.redirect(redirectTo);
});

app.get('/register', (req, res) => {
  res.render('register', { user: req.session.user, cartCount: getCartCount(getCart(req)) });
});

app.post('/register', async (req, res) => {
  const { full_name, username, password, email } = req.body;
  if (!full_name || !username || !password) {
    req.session.flash = { type: 'error', message: 'يرجى تعبئة جميع الحقول المطلوبة.' };
    return res.redirect('/register');
  }
  const exists = await getUserByUsername(username.trim());
  if (exists) {
    req.session.flash = { type: 'error', message: 'اسم المستخدم موجود مسبقًا.' };
    return res.redirect('/register');
  }
  const hash = await bcrypt.hash(password, 10);
  await run(`
    INSERT INTO users (username, password_hash, role, permissions, full_name, email)
    VALUES (?, ?, 'customer', '[]', ?, ?)
  `, [username.trim(), hash, full_name.trim(), email || null]);
  req.session.flash = { type: 'success', message: 'تم إنشاء الحساب بنجاح، الآن يمكنك تسجيل الدخول.' };
  res.redirect('/login');
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.post('/cart/add', async (req, res) => {
  const productId = Number(req.body.productId);
  const size = req.body.size || 'Default';
  const color = req.body.color || 'Default';
  const quantity = Number(req.body.quantity || 1);

  const product = await getProductById(productId);
  if (!product || Number(product.is_hidden) === 1) {
    return res.json({ success: false, message: 'المنتج غير متوفر.' });
  }

  const cart = getCart(req);
  const key = `${productId}:${size}:${color}`;
  const existing = cart[key] || { productId, name: product.name, price: Number(product.price), size, color, quantity: 0 };
  const totalQty = existing.quantity + quantity;
  if (product.stock < totalQty) {
    return res.json({ success: false, message: 'الكمية المطلوبة غير متوفرة في المخزون.' });
  }

  cart[key] = { ...existing, quantity: totalQty };
  req.session.cart = cart;

  res.json({ success: true, message: 'تمت إضافة المنتج إلى السلة.', cartCount: getCartCount(cart) });
});

app.get('/cart', (req, res) => {
  const cart = getCart(req);
  const items = Object.values(cart);
  const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  res.render('cart', { items, total, user: req.session.user, cartCount: getCartCount(cart) });
});

app.post('/cart/update', (req, res) => {
  const cart = getCart(req);
  const key = req.body.key;
  const quantity = Number(req.body.quantity || 1);
  if (cart[key]) {
    cart[key].quantity = Math.max(1, quantity);
    req.session.cart = cart;
  }
  res.redirect('/cart');
});

app.post('/cart/remove', (req, res) => {
  const cart = getCart(req);
  const key = req.body.key;
  if (cart[key]) delete cart[key];
  req.session.cart = cart;
  res.redirect('/cart');
});

app.get('/checkout', requireAuth, async (req, res) => {
  const cart = getCart(req);
  const items = Object.values(cart);
  if (!items.length) {
    req.session.flash = { type: 'error', message: 'السلة فارغة، أضف منتجات أولاً.' };
    return res.redirect('/');
  }
  const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  res.render('checkout', { items, total, user: req.session.user, cartCount: getCartCount(cart) });
});

app.post('/checkout', requireAuth, upload.single('receipt'), async (req, res) => {
  const cart = getCart(req);
  const items = Object.values(cart);
  if (!items.length) {
    req.session.flash = { type: 'error', message: 'لا توجد عناصر في السلة.' };
    return res.redirect('/cart');
  }

  const { customer_name, phone, address, notes, payment_method, transaction_ref } = req.body;
  const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

  if (!customer_name || !phone || !address) {
    req.session.flash = { type: 'error', message: 'يرجى إدخال اسم العميل، الهاتف والعنوان.' };
    return res.redirect('/checkout');
  }

  const receiptImage = req.file ? `/uploads/${req.file.filename}` : null;

  if (payment_method === 'vodafone' && (!transaction_ref || !receiptImage)) {
    req.session.flash = { type: 'error', message: 'للدفع عبر فودافون كاش يرجى رفع صورة الإيصال وإدخال رقم العملية.' };
    return res.redirect('/checkout');
  }

  const orderResult = await run(`
    INSERT INTO orders (
      user_id, customer_name, phone, address, notes, total, payment_method,
      payment_status, status, transaction_ref, receipt_image, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `, [
    req.session.user.id,
    customer_name,
    phone,
    address,
    notes || '',
    total,
    payment_method,
    payment_method === 'cash_on_delivery' ? 'pending' : 'pending',
    'pending',
    transaction_ref || null,
    receiptImage
  ]);

  const orderId = orderResult.id;

  for (const item of items) {
    const product = await getProductById(item.productId);
    if (product) {
      await run(`
        INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [orderId, item.productId, item.name, item.size, item.color, item.quantity, item.price]);
      await run('UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [item.quantity, item.productId]);
    }
  }

  req.session.cart = {};
  req.session.flash = { type: 'success', message: 'تم تقديم الطلب بنجاح، وسيتم مراجعة الدفع من الإدارة.' };
  res.redirect('/');
});

app.get('/admin', requireAuth, requireAdminPermission('dashboard'), async (req, res) => {
  const products = await getAllProducts();
  const orders = await getAdminOrders();
  const admins = await getAllAdmins();
  const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const pendingOrders = orders.filter((order) => order.payment_status === 'pending').length;
  const totalStock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);

  res.render('admin', {
    user: req.session.user,
    cartCount: getCartCount(getCart(req)),
    stats: { products: products.length, orders: orders.length, admins: admins.length, pendingOrders, totalSales, totalStock }
  });
});

app.get('/admin/products', requireAuth, requireAdminPermission('products'), async (req, res) => {
  const products = await getAllProducts();
  res.render('admin-products', { user: req.session.user, cartCount: getCartCount(getCart(req)), products });
});

app.post('/admin/products', requireAuth, requireAdminPermission('products'), upload.array('images', 6), async (req, res) => {
  const { name, description, price, stock, sizes, colors, category, featured, is_hidden } = req.body;
  const imageFiles = (req.files || []).map((file) => `/uploads/${file.filename}`);

  if (!name || !price || !stock) {
    req.session.flash = { type: 'error', message: 'يرجى إدخال اسم المنتج والسعر والكمية.' };
    return res.redirect('/admin/products');
  }

  const sizesList = sizes ? sizes.split(',').map((item) => item.trim()).filter(Boolean) : [];
  const colorsList = colors ? colors.split(',').map((item) => item.trim()).filter(Boolean) : [];
  await run(`
    INSERT INTO products (name, description, price, stock, sizes, colors, images, category, featured, is_hidden)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    name,
    description || '',
    Number(price),
    Number(stock),
    jsonString(sizesList),
    jsonString(colorsList),
    jsonString(imageFiles),
    category || 'General',
    featured === 'on' ? 1 : 0,
    is_hidden === 'on' ? 1 : 0
  ]);

  req.session.flash = { type: 'success', message: 'تمت إضافة المنتج بنجاح وظهر في المتجر.' };
  res.redirect('/admin/products');
});

app.post('/admin/products/:id/update', requireAuth, requireAdminPermission('products'), upload.array('images', 6), async (req, res) => {
  const product = await getProductById(req.params.id);
  if (!product) return res.redirect('/admin/products');

  const { name, description, price, stock, sizes, colors, category, featured, is_hidden } = req.body;
  const previousImages = parseJson(product.images);
  const incomingImages = (req.files || []).map((file) => `/uploads/${file.filename}`);
  const finalImages = incomingImages.length ? incomingImages : previousImages;
  const sizesList = sizes ? sizes.split(',').map((item) => item.trim()).filter(Boolean) : parseJson(product.sizes);
  const colorsList = colors ? colors.split(',').map((item) => item.trim()).filter(Boolean) : parseJson(product.colors);

  await run(`
    UPDATE products SET
      name = ?, description = ?, price = ?, stock = ?, sizes = ?, colors = ?, images = ?, category = ?, featured = ?, is_hidden = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    name || product.name,
    description || product.description,
    Number(price || product.price),
    Number(stock || product.stock),
    jsonString(sizesList),
    jsonString(colorsList),
    jsonString(finalImages),
    category || product.category,
    featured === 'on' ? 1 : 0,
    is_hidden === 'on' ? 1 : 0,
    req.params.id
  ]);

  req.session.flash = { type: 'success', message: 'تم تحديث المنتج بنجاح.' };
  res.redirect('/admin/products');
});

app.post('/admin/products/:id/delete', requireAuth, requireAdminPermission('products'), async (req, res) => {
  await run('DELETE FROM products WHERE id = ?', [req.params.id]);
  await run('DELETE FROM order_items WHERE product_id = ?', [req.params.id]);
  req.session.flash = { type: 'success', message: 'تم حذف المنتج.' };
  res.redirect('/admin/products');
});

app.get('/admin/orders', requireAuth, requireAdminPermission('orders'), async (req, res) => {
  const orders = await getAdminOrders();
  const prepared = [];

  for (const order of orders) {
    const items = await getOrderItems(order.id);
    prepared.push({ ...order, items });
  }

  res.render('admin-orders', { user: req.session.user, cartCount: getCartCount(getCart(req)), orders: prepared });
});

app.post('/admin/orders/:id/status', requireAuth, requireAdminPermission('orders'), async (req, res) => {
  const { payment_status, status } = req.body;
  await run(`
    UPDATE orders SET payment_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `, [payment_status || 'pending', status || 'pending', req.params.id]);
  req.session.flash = { type: 'success', message: 'تم تحديث حالة الطلب.' };
  res.redirect('/admin/orders');
});

app.get('/admin/admins', requireAuth, requireAdminPermission('admins'), async (req, res) => {
  const admins = await getAllAdmins();
  res.render('admin-admins', { user: req.session.user, cartCount: getCartCount(getCart(req)), admins });
});

app.post('/admin/admins', requireAuth, requireAdminPermission('admins'), async (req, res) => {
  if (req.session.user.role !== 'owner') {
    req.session.flash = { type: 'error', message: 'فقط المالك الأساسي يمكنه إدارة الحسابات الإدارية.' };
    return res.redirect('/admin/admins');
  }

  const { username, password, role, full_name, permissions } = req.body;
  if (!username || !password) {
    req.session.flash = { type: 'error', message: 'اسم المستخدم وكلمة المرور مطلوبان.' };
    return res.redirect('/admin/admins');
  }

  const exists = await getUserByUsername(username.trim());
  if (exists) {
    req.session.flash = { type: 'error', message: 'اسم المستخدم موجود بالفعل.' };
    return res.redirect('/admin/admins');
  }

  const selectedRole = role && ROLE_PERMISSIONS[role] ? role : 'admin';
  const selectedPermissions = Array.isArray(permissions) ? permissions : (permissions ? [permissions] : []);
  const perms = normalizePermissions(selectedRole, selectedPermissions);
  const hash = await bcrypt.hash(password, 10);
  await run(`
    INSERT INTO users (username, password_hash, role, permissions, full_name, active)
    VALUES (?, ?, ?, ?, ?, 1)
  `, [username.trim(), hash, selectedRole, jsonString(perms), full_name || username.trim()]);

  req.session.flash = { type: 'success', message: 'تم إنشاء حساب الأدمن بنجاح.' };
  res.redirect('/admin/admins');
});

app.post('/admin/admins/:id/update', requireAuth, requireAdminPermission('admins'), async (req, res) => {
  const target = await get('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!target) return res.redirect('/admin/admins');

  if (req.session.user.role !== 'owner' && target.role === 'owner') {
    req.session.flash = { type: 'error', message: 'لا يمكنك تعديل بيانات المالك الأساسي.' };
    return res.redirect('/admin/admins');
  }

  const role = target.role === 'owner' ? 'owner' : (req.body.role && ROLE_PERMISSIONS[req.body.role] ? req.body.role : target.role);
  const selectedPermissions = Array.isArray(req.body.permissions) ? req.body.permissions : (req.body.permissions ? [req.body.permissions] : normalizePermissions(role, []));
  const permissions = normalizePermissions(role, selectedPermissions);

  await run(`
    UPDATE users SET role = ?, permissions = ?, full_name = ?, active = ? WHERE id = ?
  `, [role, jsonString(permissions), req.body.full_name || target.full_name, req.body.active === 'on' ? 1 : 0, req.params.id]);

  req.session.flash = { type: 'success', message: 'تم تحديث صلاحيات الأدمن بنجاح.' };
  res.redirect('/admin/admins');
});

app.post('/admin/admins/:id/delete', requireAuth, requireAdminPermission('admins'), async (req, res) => {
  const target = await get('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!target) return res.redirect('/admin/admins');

  if (target.role === 'owner') {
    req.session.flash = { type: 'error', message: 'لا يمكن حذف الحساب الأساسي للمالك.' };
    return res.redirect('/admin/admins');
  }

  if (req.session.user.role !== 'owner') {
    req.session.flash = { type: 'error', message: 'فقط المالك يمكنه حذف الأعضاء الإداريين.' };
    return res.redirect('/admin/admins');
  }

  await run('DELETE FROM users WHERE id = ?', [req.params.id]);
  req.session.flash = { type: 'success', message: 'تم حذف الأدمن بنجاح.' };
  res.redirect('/admin/admins');
});

app.get('/403', (req, res) => {
  res.status(403).render('403', { user: req.session.user, cartCount: getCartCount(getCart(req)) });
});

app.use((req, res) => {
  res.status(404).render('404', { user: req.session.user, cartCount: getCartCount(getCart(req)) });
});

async function startup() {
  await ensureDatabase();
  app.listen(PORT, () => {
    console.log(`JASMINE STYLE store is running on http://localhost:${PORT}`);
  });
}

startup();
