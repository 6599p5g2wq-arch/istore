import crypto from "crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { hashPassword } from "./auth";
import type { Customer } from "./types";

export function registerCustomer(name: string, email: string, phone: string, password: string): { id: number } | { error: string } {
  const db = getDb();
  if (db.prepare("SELECT id FROM customers WHERE email = ?").get(email)) return { error: "هذا البريد مسجل مسبقاً — سجل دخولك" };
  const salt = crypto.randomBytes(16).toString("hex");
  const r = db.prepare("INSERT INTO customers (name, email, phone, pass_hash, salt) VALUES (?, ?, ?, ?, ?)").run(name, email, phone, hashPassword(password, salt), salt);
  return { id: Number(r.lastInsertRowid) };
}

export function verifyCustomer(email: string, password: string): number | null {
  const db = getDb();
  const row = db.prepare("SELECT id, pass_hash, salt FROM customers WHERE email = ?").get(email) as { id: number; pass_hash: string; salt: string } | undefined;
  if (!row) return null;
  const hash = hashPassword(password, row.salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(row.pass_hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return row.id;
}

export function createCustomerSession(customerId: number): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO customer_sessions (token, customer_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").run(token, customerId);
  return token;
}

export function getSessionCustomer(): Customer | null {
  const token = cookies().get("customer_session")?.value;
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT c.id, c.name, c.email, c.phone, c.created_at FROM customer_sessions s JOIN customers c ON c.id = s.customer_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`
    )
    .get(token) as Customer | undefined;
  return row ?? null;
}

export function destroyCustomerSession(token: string) {
  const db = getDb();
  db.prepare("DELETE FROM customer_sessions WHERE token = ?").run(token);
}
