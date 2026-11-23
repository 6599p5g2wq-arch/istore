import type Database from "better-sqlite3";
import type { Coupon } from "./types";

export function validateCoupon(db: Database.Database, code: string, subtotal: number, customerId: number | null = null): { ok: true; discount: number; coupon: Coupon } | { ok: false; error: string } {
  const c = db.prepare("SELECT * FROM coupons WHERE UPPER(code) = UPPER(?)").get(code.trim()) as Coupon | undefined;
  if (!c || !c.active) return { ok: false, error: "كود الخصم غير صالح" };
  // كوبون خاص بزبون محدد (مثل كوبون الترحيب)
  if (c.customer_id && c.customer_id !== customerId) return { ok: false, error: "كود الخصم غير صالح" };
  const today = new Date().toISOString().slice(0, 10);
  if (c.starts_at && c.starts_at > today) return { ok: false, error: "هذا الكود لم يبدأ بعد" };
  if (c.expires_at && c.expires_at < today) return { ok: false, error: "انتهت صلاحية هذا الكود" };
  if (c.max_uses > 0 && c.used_count >= c.max_uses) return { ok: false, error: "انتهى عدد مرات استخدام هذا الكود" };
  if (subtotal < c.min_total) return { ok: false, error: `هذا الكود يتطلب حد أدنى للطلب ${c.min_total} د.ل` };
  const discount = c.kind === "percent" ? Math.round(subtotal * (c.value / 100)) : Math.min(c.value, subtotal);
  if (discount <= 0) return { ok: false, error: "كود الخصم غير صالح" };
  return { ok: true, discount, coupon: c };
}
