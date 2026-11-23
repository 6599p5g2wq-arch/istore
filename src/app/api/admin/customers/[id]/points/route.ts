import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";
import { addPoints } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

// تعديل رصيد النقاط يدوياً (delta موجب أو سالب) أو ضبط وضع VIP (vip: "auto" | "on" | "off")
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const db = getDb();
  const c = db.prepare("SELECT id FROM customers WHERE id = ?").get(params.id);
  if (!c) return bad("الزبون غير موجود", 404);
  if (b.vip !== undefined) {
    const v = b.vip === "on" ? 1 : b.vip === "off" ? 0 : null;
    db.prepare("UPDATE customers SET vip_override = ? WHERE id = ?").run(v, params.id);
    return NextResponse.json({ ok: true });
  }
  const delta = Math.trunc(Number(b.delta));
  if (!Number.isFinite(delta) || delta === 0 || Math.abs(delta) > 10000000) return bad("عدد النقاط غير صالح");
  const reason = String(b.reason || "").trim().slice(0, 200) || "تعديل من المشرف";
  addPoints(db, Number(params.id), delta, reason);
  return NextResponse.json({ ok: true });
}
