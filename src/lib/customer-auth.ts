import crypto from "crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { hashPassword } from "./auth";
import { normalizeLibyanPhone } from "./phone";
import type { Customer } from "./types";

export const MIN_PASSWORD = 8;

export function registerCustomer(name: string, email: string, phone: string, password: string): { id: number } | { error: string } {
  const db = getDb();
  if (db.prepare("SELECT id FROM customers WHERE email = ?").get(email)) return { error: "هذا البريد مسجل مسبقاً — سجل دخولك" };
  if (db.prepare("SELECT id FROM customers WHERE phone = ?").get(phone)) return { error: "هذا الرقم مسجل مسبقاً — سجل دخولك" };
  const salt = crypto.randomBytes(16).toString("hex");
  const r = db.prepare("INSERT INTO customers (name, email, phone, pass_hash, salt) VALUES (?, ?, ?, ?, ?)").run(name, email, phone, hashPassword(password, salt), salt);
  return { id: Number(r.lastInsertRowid) };
}

/** الدخول بالبريد أو برقم الهاتف. يعيد id أو { error } */
export function verifyCustomer(identifier: string, password: string): { id: number } | { error: string } {
  const db = getDb();
  const idf = identifier.trim();
  let row: { id: number; pass_hash: string; salt: string; blocked: number } | undefined;
  if (idf.includes("@")) {
    row = db.prepare("SELECT id, pass_hash, salt, blocked FROM customers WHERE email = ?").get(idf.toLowerCase()) as typeof row;
  } else {
    const ph = normalizeLibyanPhone(idf);
    row = db.prepare("SELECT id, pass_hash, salt, blocked FROM customers WHERE phone = ? OR phone = ?").get(ph || "\0", idf) as typeof row;
  }
  const fail = { error: "بيانات الدخول غير صحيحة" };
  if (!row) return fail;
  const hash = hashPassword(password, row.salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(row.pass_hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return fail;
  if (row.blocked) return { error: "هذا الحساب موقوف، تواصل معنا عبر واتساب" };
  db.prepare("UPDATE customers SET last_login = datetime('now') WHERE id = ?").run(row.id);
  return { id: row.id };
}

export function createCustomerSession(customerId: number): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO customer_sessions (token, customer_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").run(token, customerId);
  return token;
}

export async function getSessionCustomer(): Promise<Customer | null> {
  const token = (await cookies()).get("customer_session")?.value;
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT c.id, c.name, c.email, c.phone, c.created_at, c.city, c.address, c.must_change, c.points FROM customer_sessions s JOIN customers c ON c.id = s.customer_id
       WHERE s.token = ? AND s.expires_at > datetime('now') AND c.blocked = 0`
    )
    .get(token) as Customer | undefined;
  return row ?? null;
}

export function destroyCustomerSession(token: string) {
  const db = getDb();
  db.prepare("DELETE FROM customer_sessions WHERE token = ?").run(token);
}

export function setCustomerPassword(customerId: number, password: string, mustChange = 0, keepToken = "") {
  const db = getDb();
  const salt = crypto.randomBytes(16).toString("hex");
  db.transaction(() => {
  db.prepare("UPDATE customers SET pass_hash = ?, salt = ?, must_change = ? WHERE id = ?").run(hashPassword(password, salt), salt, mustChange, customerId);
  db.prepare("DELETE FROM customer_sessions WHERE customer_id=? AND token!=?").run(customerId,keepToken);
  })();
}

export function checkCustomerPassword(customerId: number, password: string): boolean {
  const db = getDb();
  const row = db.prepare("SELECT pass_hash, salt FROM customers WHERE id = ?").get(customerId) as { pass_hash: string; salt: string } | undefined;
  if (!row) return false;
  const a = Buffer.from(hashPassword(password, row.salt), "hex");
  const b = Buffer.from(row.pass_hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
