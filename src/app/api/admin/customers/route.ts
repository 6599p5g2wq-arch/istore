import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin, bad } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { normalizeLibyanPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

function tempPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(crypto.randomBytes(8)).map((b) => chars[b % chars.length]).join("");
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(); if (auth) return auth;
  const db = getDb();
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim().slice(0, 100);
  const email = String(b.email || "").trim().toLowerCase();
  const phone = normalizeLibyanPhone(b.phone || "");
  if (!name) return bad("الاسم مطلوب");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("البريد الإلكتروني غير صحيح");
  if (!phone) return bad("رقم الهاتف غير صحيح");
  if (db.prepare("SELECT id FROM customers WHERE email = ?").get(email)) return bad("البريد مستخدم في حساب آخر");
  if (db.prepare("SELECT id FROM customers WHERE phone = ?").get(phone)) return bad("الرقم مستخدم في حساب آخر");
  const pw = tempPassword();
  const salt = crypto.randomBytes(16).toString("hex");
  const r = db.prepare("INSERT INTO customers (name, email, phone, pass_hash, salt, must_change) VALUES (?, ?, ?, ?, ?, 1)")
    .run(name, email, phone, hashPassword(pw, salt), salt);
  return NextResponse.json({ ok: true, id: Number(r.lastInsertRowid), password: pw });
}

export async function GET() {
  const auth = requireAdmin(); if (auth) return auth;
  const db = getDb();
  const customers = db.prepare("SELECT id, name, phone FROM customers ORDER BY name COLLATE NOCASE LIMIT 1000").all();
  return NextResponse.json({ customers });
}
