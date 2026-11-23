import crypto from "crypto";
import type Database from "better-sqlite3";

export type Program = {
  welcome: { enabled: boolean; percent: number; days: number; maxUses: number };
  loyalty: { enabled: boolean; perLyd: number; redeemPoints: number; redeemValue: number };
  vip: { enabled: boolean; threshold: number };
};

function num(v: string | undefined, d: number): number {
  const n = Number(v);
  return v !== undefined && v !== "" && Number.isFinite(n) ? n : d;
}

/** إعدادات الترحيب والولاء وVIP من جدول settings مع القيم الافتراضية */
export function getProgram(db: Database.Database): Program {
  const rows = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'welcome_%' OR key LIKE 'loyalty_%' OR key LIKE 'vip_%'").all() as { key: string; value: string }[];
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key] = r.value;
  return {
    welcome: { enabled: s.welcome_enabled === "1", percent: num(s.welcome_percent, 10), days: num(s.welcome_days, 30), maxUses: num(s.welcome_max_uses, 1) },
    loyalty: { enabled: s.loyalty_enabled === "1", perLyd: num(s.loyalty_per_lyd, 1), redeemPoints: Math.max(1, num(s.loyalty_redeem_points, 100)), redeemValue: num(s.loyalty_redeem_value, 5) },
    vip: { enabled: s.vip_enabled === "1", threshold: num(s.vip_threshold, 2000) },
  };
}

export const PROGRAM_FIELDS: Record<string, { key: string; min: number; max: number }[]> = {
  welcome: [
    { key: "welcome_percent", min: 1, max: 90 },
    { key: "welcome_days", min: 1, max: 3650 },
    { key: "welcome_max_uses", min: 1, max: 1000 },
  ],
  loyalty: [
    { key: "loyalty_per_lyd", min: 0.01, max: 1000 },
    { key: "loyalty_redeem_points", min: 1, max: 1000000 },
    { key: "loyalty_redeem_value", min: 0.01, max: 100000 },
  ],
  vip: [{ key: "vip_threshold", min: 1, max: 100000000 }],
};

export function pointsValue(points: number, p: Program): number {
  return Math.floor(points / p.loyalty.redeemPoints) * p.loyalty.redeemValue;
}

export function addPoints(db: Database.Database, customerId: number, delta: number, reason: string, orderId: number | null = null) {
  const cur = (db.prepare("SELECT points FROM customers WHERE id = ?").get(customerId) as { points: number } | undefined)?.points ?? 0;
  const next = Math.max(0, cur + delta);
  db.prepare("UPDATE customers SET points = ? WHERE id = ?").run(next, customerId);
  db.prepare("INSERT INTO points_log (customer_id, delta, reason, order_id) VALUES (?, ?, ?, ?)").run(customerId, next - cur, reason, orderId);
}

/** VIP تلقائي عند بلوغ حد الإنفاق، أو يدوي (vip_override: 1 مفعّل، 0 معطّل، null تلقائي) */
export function isVip(spent: number, override: number | null, p: Program): boolean {
  if (override === 1) return true;
  if (override === 0) return false;
  return p.vip.enabled && spent >= p.vip.threshold;
}

export function createWelcomeCoupon(db: Database.Database, customerId: number): string | null {
  const p = getProgram(db);
  if (!p.welcome.enabled) return null;
  const code = "WELCOME-" + crypto.randomBytes(3).toString("hex").toUpperCase();
  const exp = new Date(Date.now() + p.welcome.days * 86400000).toISOString().slice(0, 10);
  db.prepare("INSERT INTO coupons (code, kind, value, min_total, expires_at, max_uses, customer_id) VALUES (?, 'percent', ?, 0, ?, ?, ?)").run(code, p.welcome.percent, exp, p.welcome.maxUses, customerId);
  return code;
}

type OrderRow = { id: number; status: string; customer_id: number | null; subtotal: number; discount: number; points_discount: number; points_used: number; points_awarded: number; points_refunded: number; coupon_code: string };

/** آثار تغيير حالة الطلب على النقاط وعدّاد استخدام الكوبون */
export function applyOrderStatusEffects(db: Database.Database, orderId: number, oldStatus: string, newStatus: string) {
  if (oldStatus === newStatus) return;
  const o = db.prepare("SELECT id, status, customer_id, subtotal, discount, points_discount, points_used, points_awarded, points_refunded, coupon_code FROM orders WHERE id = ?").get(orderId) as OrderRow | undefined;
  if (!o) return;
  const p = getProgram(db);
  if (newStatus === "cancelled") {
    if (o.coupon_code && o.discount > 0) db.prepare("UPDATE coupons SET used_count = MAX(0, used_count - 1) WHERE UPPER(code) = UPPER(?)").run(o.coupon_code);
    if (o.customer_id) {
      if (o.points_used > 0 && !o.points_refunded) {
        addPoints(db, o.customer_id, o.points_used, "إرجاع نقاط طلب ملغي", o.id);
        db.prepare("UPDATE orders SET points_refunded = 1 WHERE id = ?").run(o.id);
      }
      if (o.points_awarded > 0) {
        addPoints(db, o.customer_id, -o.points_awarded, "سحب نقاط طلب ملغي", o.id);
        db.prepare("UPDATE orders SET points_awarded = 0 WHERE id = ?").run(o.id);
      }
    }
    return;
  }
  if (oldStatus === "cancelled") {
    if (o.coupon_code && o.discount > 0) db.prepare("UPDATE coupons SET used_count = used_count + 1 WHERE UPPER(code) = UPPER(?)").run(o.coupon_code);
    if (o.customer_id && o.points_refunded) {
      addPoints(db, o.customer_id, -o.points_used, "خصم نقاط بعد إعادة تفعيل الطلب", o.id);
      db.prepare("UPDATE orders SET points_refunded = 0 WHERE id = ?").run(o.id);
    }
  }
  if (newStatus === "delivered" && o.customer_id && p.loyalty.enabled && !o.points_awarded) {
    const earned = Math.floor(Math.max(0, o.subtotal - o.discount - o.points_discount) * p.loyalty.perLyd);
    if (earned > 0) {
      addPoints(db, o.customer_id, earned, "نقاط طلب مكتمل", o.id);
      db.prepare("UPDATE orders SET points_awarded = ? WHERE id = ?").run(earned, o.id);
    }
  }
}
