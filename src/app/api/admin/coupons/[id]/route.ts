import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const db = getDb();
  const existing = db.prepare("SELECT id FROM coupons WHERE id = ?").get(params.id);
  if (!existing) return bad("الكوبون غير موجود", 404);

  // Toggle-only request keeps old behavior.
  if (b.code === undefined) {
    db.prepare("UPDATE coupons SET active = ? WHERE id = ?").run(b.active ? 1 : 0, params.id);
    return NextResponse.json({ ok: true });
  }

  // Full edit: used_count is preserved.
  const code = String(b.code || "").trim().toUpperCase();
  if (!code || code.length > 40) return bad("كود الخصم مطلوب");
  if (!["percent", "fixed"].includes(b.kind)) return bad("نوع الخصم غير صالح");
  const value = Number(b.value) || 0;
  if (value <= 0 || (b.kind === "percent" && value > 90)) return bad("قيمة الخصم غير صالحة");
  if (db.prepare("SELECT id FROM coupons WHERE UPPER(code) = ? AND id != ?").get(code, params.id)) return bad("هذا الكود موجود مسبقاً");
  const startsAt = String(b.starts_at || "").trim();
  const expiresAt = String(b.expires_at || "").trim();
  if (startsAt && expiresAt && startsAt > expiresAt) return bad("تاريخ البداية بعد تاريخ الانتهاء");
  const maxUses = Math.max(0, Math.floor(Number(b.max_uses) || 0));
  const customerId = b.customer_id ? Number(b.customer_id) : null;
  if (customerId && !db.prepare("SELECT id FROM customers WHERE id = ?").get(customerId)) return bad("الزبون غير موجود");
  db.prepare("UPDATE coupons SET code = ?, kind = ?, value = ?, min_total = ?, starts_at = ?, expires_at = ?, max_uses = ?, customer_id = ? WHERE id = ?")
    .run(code, b.kind, value, Number(b.min_total) || 0, startsAt, expiresAt, maxUses, customerId, params.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const db = getDb();
  db.prepare("DELETE FROM coupons WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
