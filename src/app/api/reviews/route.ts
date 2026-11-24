import {clientIp,tooMany} from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/**
 * Verified reviews only: the order code + phone must match a DELIVERED order
 * containing this product. Approved automatically when verified.
 */
export async function POST(req: NextRequest) {
  if (tooMany("review:"+clientIp(req),8)) return NextResponse.json({error:"محاولات كثيرة، حاول لاحقا"},{status:429});
  const b = await req.json().catch(() => ({}));
  if (!b || typeof b!=="object" || ["name", "comment", "phone", "order_code"].some(k=>b[k]!==undefined && typeof b[k]!=="string")) return bad("بيانات غير صالحة");
  const productId = Number(b.product_id) || 0;
  const name = (b.name || "").trim().slice(0, 80);
  const rating = Number(b.rating);
  if (!Number.isInteger(rating) || rating<1 || rating>5) return bad("تقييم غير صالح");
  const comment = (b.comment || "").trim().slice(0, 1000);
  const phone = (b.phone || "").trim();
  const code = (b.order_code || "").trim().toUpperCase();
  if (!productId || !name || !rating) return bad("الاسم والتقييم مطلوبان");
  if (!phone || !code) return bad("أدخل رقم الطلب ورقم الهاتف لتوثيق تقييمك");

  const db = getDb();
  const order = db.prepare(
    `SELECT o.id FROM orders o JOIN order_items oi ON oi.order_id = o.id
     WHERE UPPER(o.code) = ? AND o.phone = ? AND o.status = 'delivered' AND oi.product_id = ?`
  ).get(code, phone, productId);
  if (!order) return bad("التقييم متاح فقط لمن استلم هذا المنتج فعلاً — تأكد من رقم الطلب والهاتف", 403);

  const dup = db.prepare("SELECT id FROM reviews WHERE product_id = ? AND order_code = ?").get(productId, code);
  if (dup) return bad("قمت بتقييم هذا المنتج من قبل");

  db.prepare("INSERT INTO reviews (product_id, customer_name, rating, comment, phone, order_code, approved) VALUES (?, ?, ?, ?, ?, ?, 1)")
    .run(productId, name, rating, comment, phone, code);
  // Refresh the product's displayed rating from real verified reviews.
  db.prepare(
    `UPDATE products SET rating = (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = ? AND approved = 1) WHERE id = ?`
  ).run(productId, productId);
  return NextResponse.json({ ok: true });
}
