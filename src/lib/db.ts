import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { seedIfEmpty } from "./seed";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "istore.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  seedIfEmpty(db);
  _db = db;
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL DEFAULT 0,
    old_price REAL,
    stock INTEGER NOT NULL DEFAULT 0,
    image TEXT NOT NULL DEFAULT '',
    images TEXT NOT NULL DEFAULT '[]',
    badge TEXT NOT NULL DEFAULT '',
    featured INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    rating REAL NOT NULL DEFAULT 4.8,
    options TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT '',
    options TEXT NOT NULL DEFAULT '{}',
    price REAL,
    stock INTEGER NOT NULL DEFAULT 0,
    image TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    subtotal REAL NOT NULL DEFAULT 0,
    delivery_fee REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER,
    variant_id INTEGER,
    name TEXT NOT NULL,
    variant_label TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS order_status_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    fee REAL NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS hero_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    subtitle TEXT NOT NULL DEFAULT '',
    cta_text TEXT NOT NULL DEFAULT 'تسوق الآن',
    cta_link TEXT NOT NULL DEFAULT '/products',
    image TEXT NOT NULL DEFAULT '',
    theme TEXT NOT NULL DEFAULT 'dark',
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    subtitle TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    link TEXT NOT NULL DEFAULT '/products',
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    pass_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    kind TEXT NOT NULL DEFAULT 'percent',
    value REAL NOT NULL DEFAULT 0,
    min_total REAL NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    expires_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS points_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    order_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS stock_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    contact TEXT NOT NULL,
    notified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(product_id, contact)
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 5,
    comment TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL,
    order_code TEXT NOT NULL,
    approved INTEGER NOT NULL DEFAULT 0,
    reply TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS cart_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    items TEXT NOT NULL DEFAULT '[]',
    total REAL NOT NULL DEFAULT 0,
    reminded INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_leads_phone ON cart_leads(phone);
  CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    referrer TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL DEFAULT '',
    pass_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS customer_sessions (
    token TEXT PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  );
  `);
  // Migrations for databases created before these columns existed.
  for (const stmt of [
    "ALTER TABLE orders ADD COLUMN discount REAL NOT NULL DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN coupon_code TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE orders ADD COLUMN customer_id INTEGER",
    "ALTER TABLE products ADD COLUMN brand_id INTEGER",
    "ALTER TABLE products ADD COLUMN options TEXT NOT NULL DEFAULT '[]'",
    "ALTER TABLE order_items ADD COLUMN variant_id INTEGER",
    "ALTER TABLE order_items ADD COLUMN variant_label TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE customers ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE customers ADD COLUMN last_login TEXT",
    "ALTER TABLE customers ADD COLUMN city TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE customers ADD COLUMN address TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE customers ADD COLUMN must_change INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE customers ADD COLUMN points INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE customers ADD COLUMN vip_override INTEGER",
    "ALTER TABLE coupons ADD COLUMN max_uses INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE coupons ADD COLUMN used_count INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE coupons ADD COLUMN customer_id INTEGER",
    "ALTER TABLE coupons ADD COLUMN starts_at TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE orders ADD COLUMN points_used INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN points_discount REAL NOT NULL DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN points_awarded INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN points_refunded INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN admin_notes TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE brands ADD COLUMN description TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE reviews ADD COLUMN reply TEXT NOT NULL DEFAULT ''",
  ]) {
    try { db.exec(stmt); } catch { /* column already exists */ }
  }
  // Backfill the status log for orders that predate it (their status as of their creation date).
  try {
    db.exec("INSERT INTO order_status_log (order_id, status, created_at) SELECT id, status, created_at FROM orders WHERE NOT EXISTS (SELECT 1 FROM order_status_log LIMIT 1)");
  } catch { /* log already populated */ }
}

export function dataDir() {
  const d = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(d, { recursive: true });
  return d;
}
