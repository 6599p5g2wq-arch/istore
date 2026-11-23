import { NextRequest, NextResponse } from "next/server";
import { bad } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { getSessionCustomer } from "@/lib/customer-auth";
import { normalizeLibyanPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const c = getSessionCustomer();
  if (!c) return bad("سجل دخولك أولاً", 401);
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim().slice(0, 100);
  const email = String(b.email || "").trim().toLowerCase();
  const phone = normalizeLibyanPhone(b.phone || "");
  const city = String(b.city || "").trim().slice(0, 80);
  const address = String(b.address || "").trim().slice(0, 300);
  if (!name) return bad("الاسم مطلوب");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("البريد الإلكتروني غير صحيح");
  if (!phone) return bad("رقم الهاتف غير صحيح (مثال: 0912345678)");
  const db = getDb();
  if (db.prepare("SELECT id FROM customers WHERE email = ? AND id != ?").get(email, c.id)) return bad("هذا البريد مستخدم في حساب آخر");
  if (db.prepare("SELECT id FROM customers WHERE phone = ? AND id != ?").get(phone, c.id)) return bad("هذا الرقم مستخدم في حساب آخر");
  db.prepare("UPDATE customers SET name = ?, email = ?, phone = ?, city = ?, address = ? WHERE id = ?").run(name, email, phone, city, address, c.id);
  return NextResponse.json({ ok: true });
}
