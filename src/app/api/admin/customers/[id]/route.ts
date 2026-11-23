import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin, bad } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { setCustomerPassword } from "@/lib/customer-auth";
import { normalizeLibyanPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

function tempPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(crypto.randomBytes(8)).map((b) => chars[b % chars.length]).join("");
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const db = getDb();
  const id = Number(params.id);
  if (!db.prepare("SELECT id FROM customers WHERE id = ?").get(id)) return bad("الزبون غير موجود", 404);
  const b = await req.json().catch(() => ({}));

  if (b.action === "block" || b.action === "unblock") {
    const block = b.action === "block" ? 1 : 0;
    db.prepare("UPDATE customers SET blocked = ? WHERE id = ?").run(block, id);
    if (block) db.prepare("DELETE FROM customer_sessions WHERE customer_id = ?").run(id);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "reset") {
    const pw = tempPassword();
    setCustomerPassword(id, pw, 1);
    db.prepare("DELETE FROM customer_sessions WHERE customer_id = ?").run(id);
    return NextResponse.json({ ok: true, password: pw });
  }
  // تعديل البيانات
  const name = String(b.name || "").trim().slice(0, 100);
  const email = String(b.email || "").trim().toLowerCase();
  const phone = normalizeLibyanPhone(b.phone || "");
  if (!name) return bad("الاسم مطلوب");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("البريد الإلكتروني غير صحيح");
  if (!phone) return bad("رقم الهاتف غير صحيح");
  if (db.prepare("SELECT id FROM customers WHERE email = ? AND id != ?").get(email, id)) return bad("البريد مستخدم في حساب آخر");
  if (db.prepare("SELECT id FROM customers WHERE phone = ? AND id != ?").get(phone, id)) return bad("الرقم مستخدم في حساب آخر");
  db.prepare("UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?").run(name, email, phone, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const db = getDb();
  db.prepare("UPDATE orders SET customer_id = NULL WHERE customer_id = ?").run(params.id);
  db.prepare("DELETE FROM customers WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
