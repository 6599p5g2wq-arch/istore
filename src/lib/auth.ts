import crypto from "crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function createAdmin(username: string, password: string) {
  const db = getDb();
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  db.prepare("INSERT INTO admin_users (username, pass_hash, salt) VALUES (?, ?, ?)").run(username, hash, salt);
}

export function verifyAdmin(username: string, password: string): number | null {
  const db = getDb();
  const row = db.prepare("SELECT id, pass_hash, salt FROM admin_users WHERE username = ?").get(username) as
    | { id: number; pass_hash: string; salt: string }
    | undefined;
  if (!row) return null;
  const hash = hashPassword(password, row.salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(row.pass_hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return row.id;
}

export function createSession(adminId: number): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token, admin_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(token, adminId);
  return token;
}

export function getSessionAdmin(): { id: number; username: string } | null {
  const token = cookies().get("admin_session")?.value;
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT a.id, a.username FROM sessions s JOIN admin_users a ON a.id = s.admin_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`
    )
    .get(token) as { id: number; username: string } | undefined;
  return row ?? null;
}

export function destroySession(token: string) {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}
