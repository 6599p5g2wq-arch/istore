import {clientIp,tooMany} from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (tooMany("stock-alert:"+clientIp(req),20)) return NextResponse.json({error:"محاولات كثيرة، حاول لاحقا"},{status:429});
  const b = await req.json().catch(() => ({}));
  if (!b || typeof b!=="object" || ["contact"].some(k=>b[k]!==undefined && (typeof b[k]!=="string" || b[k].length>254))) return bad("بيانات غير صالحة");
  const productId = Number(b.product_id) || 0;
  const contact = (b.contact || "").trim();
  if (!productId) return bad("المنتج غير موجود");
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const isPhone = /^[\d+\s-]{8,}$/.test(contact);
  if (!isEmail && !isPhone) return bad("أدخل بريداً إلكترونياً أو رقم هاتف صحيح");
  const db = getDb();
  if (!db.prepare("SELECT id FROM products WHERE id = ? AND active = 1").get(productId)) return bad("المنتج غير موجود", 404);
  db.prepare("INSERT INTO stock_alerts (product_id, contact) VALUES (?, ?) ON CONFLICT(product_id, contact) DO NOTHING").run(productId, contact);
  return NextResponse.json({ ok: true });
}
