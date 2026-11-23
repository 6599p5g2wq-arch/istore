import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, bad } from "@/lib/admin-api";
import { setSetting } from "@/lib/settings";
import { sanitizeAnnounce, legacyText } from "@/lib/announcement";

export const dynamic = "force-dynamic";

// الحقول النصية المسموحة في صفحة «الإعدادات» فقط (لا تُقبل مفاتيح أخرى)
const TEXT_KEYS = ["currency", "currency2_symbol"];

export async function PUT(req: NextRequest) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") return bad("بيانات غير صالحة");
  if (typeof b.currency === "string" && !b.currency.trim()) return bad("العملة مطلوبة");

  const out: Record<string, string> = {};
  for (const k of TEXT_KEYS) {
    const v = b[k];
    if (typeof v !== "string") continue;
    if (v.length > 1000) return bad("نص طويل جداً");
    out[k] = v.trim();
  }
  if (b.currency_pos !== undefined) {
    if (b.currency_pos !== "after" && b.currency_pos !== "before") return bad("موضع العملة غير صالح");
    out.currency_pos = b.currency_pos;
  }
  if (b.currency_decimals !== undefined) {
    if (!["auto", "0", "2"].includes(String(b.currency_decimals))) return bad("عدد الكسور غير صالح");
    out.currency_decimals = String(b.currency_decimals);
  }
  if (b.currency2_rate !== undefined) {
    const r = String(b.currency2_rate).trim();
    if (r !== "" && !(Number(r) > 0 && Number.isFinite(Number(r)))) return bad("سعر الصرف يجب أن يكون رقماً أكبر من صفر");
    out.currency2_rate = r;
  }
  if (b.free_shipping_threshold !== undefined) {
    const t = String(b.free_shipping_threshold).trim();
    if (t === "" || !(Number(t) >= 0 && Number.isFinite(Number(t)))) return bad("حد الشحن المجاني يجب أن يكون رقماً (0 لتعطيله)");
    out.free_shipping_threshold = String(Number(t));
  }

  let ann = null;
  if (b.announce_config !== undefined) {
    ann = sanitizeAnnounce(b.announce_config);
    if (ann.start && ann.end && ann.start >= ann.end) return bad("تاريخ بداية الشريط يجب أن يسبق تاريخ نهايته");
  }
  for (const [k, v] of Object.entries(out)) setSetting(k, v);
  if (ann) {
    setSetting("announce_config", JSON.stringify(ann));
    setSetting("announcement", legacyText(ann)); // توافق مع التطبيقات القديمة
  }
  return NextResponse.json({ ok: true });
}
