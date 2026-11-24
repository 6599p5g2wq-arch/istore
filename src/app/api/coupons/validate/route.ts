import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { bad } from "@/lib/admin-api";
import { validateCoupon } from "@/lib/coupons";
import { getSessionCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (!b || typeof b!=="object" || ["code"].some(k=>b[k]!==undefined && typeof b[k]!=="string")) return bad("بيانات غير صالحة");
  const code = (b.code || "").trim();
  const subtotal = Number(b.subtotal) || 0;
  if (!code) return bad("أدخل كود الخصم");
  const db = getDb();
  const r = validateCoupon(db, code, subtotal, (await getSessionCustomer())?.id ?? null);
  if (!r.ok) return bad(r.error);
  return NextResponse.json({ ok: true, discount: r.discount, kind: r.coupon.kind, value: r.coupon.value });
}
