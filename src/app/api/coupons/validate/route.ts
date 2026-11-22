import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { bad } from "@/lib/admin-api";
import { validateCoupon } from "@/lib/coupons";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const code = (b.code || "").trim();
  const subtotal = Number(b.subtotal) || 0;
  if (!code) return bad("أدخل كود الخصم");
  const db = getDb();
  const r = validateCoupon(db, code, subtotal);
  if (!r.ok) return bad(r.error);
  return NextResponse.json({ ok: true, discount: r.discount, kind: r.coupon.kind, value: r.coupon.value });
}
