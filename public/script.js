* {
  box-sizing: border-box;
}

:root {
  --bg: #090910;
  --bg-2: #111827;
  --panel: rgba(15, 17, 26, 0.85);
  --glass: rgba(255, 255, 255, 0.08);
  --primary: #d19bff;
  --primary-2: #8c60ff;
  --accent: #ffb86a;
  --text: #f7f5ff;
  --muted: #bfc7d9;
  --success: #48c98d;
  --error: #ff6b7a;
  --shadow: rgba(0, 0, 0, 0.35);
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background:
    radial-gradient(circle at top left, rgba(145, 77, 255, 0.30), transparent 28%),
    radial-gradient(circle at bottom right, rgba(255, 176, 107, 0.20), transparent 20%),
    linear-gradient(135deg, #06070d 0%, #110d1a 35%, #0a0c16 100%);
  color: var(--text);
  min-height: 100vh;
}

img {
  max-width: 100%;
  display: block;
}

a {
  color: inherit;
  text-decoration: none;
}

button, input, select, textarea {
  font: inherit;
}

.container {
  width: min(1200px, calc(100% - 24px));
  margin: 0 auto;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(6, 8, 15, 0.8);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 78px;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  box-shadow: 0 10px 25px rgba(177, 123, 255, 0.6);
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 18px;
  font-size: 0.95rem;
  color: var(--muted);
}

.nav-link {
  position: relative;
  transition: 0.25s ease;
}

.nav-link::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -8px;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s ease;
}

.nav-link:hover::after,
.nav-link.active::after {
  transform: scaleX(1);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-button,
.primary-button,
.secondary-button,
.ghost-button,
.admin-button {
  border: none;
  border-radius: 14px;
  padding: 0.82rem 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease;
}

.primary-button {
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
  color: #fff;
  box-shadow: 0 18px 35px rgba(150, 95, 255, 0.4);
}

.secondary-button {
  background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04));
  color: var(--text);
  border: 1px solid rgba(255,255,255,0.1);
}

.ghost-button {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.15);
  color: var(--text);
}

.primary-button:hover,
.secondary-button:hover,
.ghost-button:hover,
.admin-button:hover,
.icon-button:hover {
  transform: translateY(-2px);
}

.icon-button {
  position: relative;
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.06);
  color: var(--text);
}

.cart-badge {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  right: -2px;
  top: -4px;
  background: var(--accent);
  color: #1d1108;
  display: grid;
  place-items: center;
  font-size: 0.68rem;
  font-weight: 800;
}

.hero {
  padding: 64px 0 42px;
}

.hero-shell {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 28px;
  align-items: center;
}

.hero-copy {
  padding: 24px 0;
}

.eyebrow {
  display: inline-block;
  padding: 8px 12px;
  background: rgba(147, 108, 255, 0.1);
  border: 1px solid rgba(180, 144, 255, 0.26);
  border-radius: 999px;
  color: #ddcaff;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 14px;
}

.hero h1 {
  margin: 0 0 16px;
  font-size: clamp(2.4rem, 4vw, 5rem);
  line-height: 0.95;
  letter-spacing: -0.06em;
}

.gradient-text {
  background: linear-gradient(135deg, #f0d7ff 0%, #b989ff 38%, #ffbf8e 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero p {
  margin: 0 0 26px;
  color: var(--muted);
  line-height: 1.7;
  max-width: 620px;
  font-size: 1.02rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 30px;
}

.metric {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  border-radius: 18px;
  padding: 16px 18px;
}

.metric strong {
  display: block;
  font-size: 1.5rem;
  margin-bottom: 3px;
}

.metric span {
  color: var(--muted);
  font-size: 0.8rem;
}

.hero-visual {
  perspective: 1200px;
  position: relative;
}

.visual-stack {
  position: relative;
  min-height: 540px;
}

.visual-card {
  position: absolute;
  inset: auto auto 0 0;
  width: min(100%, 490px);
  padding: 20px;
  border-radius: 26px;
  background: linear-gradient(135deg, rgba(33,19,56,0.7), rgba(20,20,26,0.86));
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 35px 60px rgba(0,0,0,0.4);
  transform-style: preserve-3d;
  backdrop-filter: blur(10px);
}

.visual-card.large {
  left: 24px;
  top: 14px;
  transform: rotateX(6deg) rotateY(-14deg) translateY(20px);
  z-index: 2;
}

.visual-card.small {
  right: 6px;
  bottom: 12px;
  width: 220px;
  transform: rotateX(10deg) rotateY(14deg);
  z-index: 3;
}

.card-image {
  border-radius: 18px;
  overflow: hidden;
  height: 280px;
  background: linear-gradient(135deg, #5cdbd6, #8a55ff, #ffb86a);
  position: relative;
}

.card-image::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.36));
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
}

.card-meta strong {
  font-size: 1.1rem;
}

.section {
  padding: 32px 0 18px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 18px;
}

.section-head h2 {
  margin: 0;
  font-size: clamp(1.7rem, 3vw, 2.6rem);
}

.section-head a {
  color: #dbcbff;
  font-weight: 700;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 22px;
}

.product-card {
  background: rgba(15, 17, 25, 0.8);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 18px 30px rgba(0,0,0,0.18);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.product-card:hover {
  transform: translateY(-6px) rotateX(4deg);
  box-shadow: 0 25px 40px rgba(0,0,0,0.28);
}

.product-thumb {
  position: relative;
  height: 280px;
  background: linear-gradient(135deg, rgba(132,92,255,0.6), rgba(255,148,115,0.35));
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-content {
  padding: 18px 16px 16px;
}

.product-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.product-title {
  margin: 0;
  font-size: 1.15rem;
}

.product-price {
  font-weight: 800;
  font-size: 1.2rem;
  color: #ffdbb3;
}

.product-summary {
  margin: 0 0 14px;
  color: var(--muted);
  line-height: 1.6;
  min-height: 48px;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.4rem 0.8rem;
  font-size: 0.75rem;
  background: rgba(94, 216, 164, 0.12);
  color: #bff7d8;
  border: 1px solid rgba(94, 216, 164, 0.22);
}

.auth-shell {
  max-width: 540px;
  margin: 46px auto 60px;
  background: rgba(15,17,26,0.8);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 30px;
  padding: 32px 26px;
  box-shadow: 0 28px 45px rgba(0,0,0,0.24);
}

.form-grid {
  display: grid;
  gap: 14px;
}

.form-group {
  display: grid;
  gap: 8px;
}

.form-group label {
  color: #ddd7f2;
  font-weight: 600;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  border-radius: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--text);
  padding: 0.88rem 1rem;
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.store-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 28px;
  padding: 24px 0 50px;
}

.panel {
  background: rgba(15,17,26,0.8);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 20px 35px rgba(0,0,0,0.18);
}

.cart-item {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.cart-item:last-child {
  border-bottom: none;
}

.cart-item-image {
  width: 90px;
  height: 90px;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(122,90,255,0.65), rgba(255,183,110,0.5));
}

.cart-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item-details h3 {
  margin: 0 0 8px;
}

.muted {
  color: var(--muted);
}

.summary-box {
  display: grid;
  gap: 12px;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--muted);
}

.summary-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
  font-size: 1.1rem;
  font-weight: 800;
}

.product-detail {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 26px;
  padding: 30px 0 60px;
}

.gallery {
  display: grid;
  gap: 12px;
}

.gallery-main {
  overflow: hidden;
  border-radius: 24px;
  background: rgba(14, 18, 24, 0.8);
  border: 1px solid rgba(255,255,255,0.08);
  min-height: 420px;
}

.gallery-main img {
  width: 100%;
  height: 100%;
  min-height: 420px;
  object-fit: cover;
}

.gallery-thumbs {
  display: flex;
  gap: 10px;
  overflow: auto;
}

.gallery-thumbs img {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
}

.detail-card {
  background: rgba(15,17,26,0.8);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 28px;
  padding: 22px;
  box-shadow: 0 20px 35px rgba(0,0,0,0.18);
}

.detail-card h1 {
  margin: 0 0 12px;
  font-size: clamp(2rem, 4vw, 3rem);
}

.price-tag {
  font-size: 2rem;
  font-weight: 800;
  margin: 14px 0 18px;
}

.option-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.option-pill {
  padding: 0.7rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  color: var(--muted);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  overflow: hidden;
}

.data-table th,
.data-table td {
  padding: 12px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  text-align: left;
}

.admin-shell {
  display: grid;
  gap: 24px;
  padding: 24px 0 60px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 18px;
}

.stat-card {
  background: rgba(17,18,28,0.8);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 22px;
  padding: 22px 18px;
}

.admin-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 22px;
}

.side-menu {
  background: rgba(17,18,28,0.8);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 22px;
  padding: 18px 14px;
  display: grid;
  gap: 10px;
}

.side-item {
  display: block;
  padding: 0.9rem 0.8rem;
  border-radius: 12px;
  color: var(--muted);
  transition: 0.2s ease;
}

.side-item:hover,
.side-item.active {
  background: rgba(255,255,255,0.05);
  color: var(--text);
}

.form-card {
  background: rgba(17,18,28,0.8);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 22px;
  padding: 20px;
}

.inline-form {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.table-wrap {
  overflow-x: auto;
}

.flash {
  padding: 0.9rem 1rem;
  border-radius: 12px;
  margin: 14px 0;
  font-weight: 600;
}

.flash.success {
  background: rgba(72, 201, 141, 0.12);
  border: 1px solid rgba(72, 201, 141, 0.28);
  color: #c9ffe4;
}

.flash.error {
  background: rgba(255, 107, 122, 0.1);
  border: 1px solid rgba(255, 107, 122, 0.28);
  color: #ffd8dd;
}

@media (max-width: 980px) {
  .hero-shell,
  .store-grid,
  .product-detail,
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .product-grid {
    grid-template-columns: repeat(2, minmax(210px, 1fr));
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }
}

@media (max-width: 720px) {
  .nav-menu {
    display: none;
  }

  .navbar {
    min-height: 64px;
  }

  .product-grid {
    grid-template-columns: 1fr;
  }

  .metrics,
  .stats-grid,
  .form-row {
    grid-template-columns: 1fr;
  }

  .auth-shell {
    padding: 22px 18px;
  }

  .visual-card.large {
    left: 0;
    top: 0;
  }

  .visual-card.small {
    right: 0;
  }
}
