import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, bad } from "@/lib/admin-api";
import { setSetting } from "@/lib/settings";
import { sanitizeAnnounce, legacyText } from "@/lib/announcement";

export const dynamic = "force-dynamic";

// حقول صفحة «الإعدادات» المسموحة فقط
const ADMIN_SETTING_KEYS = ["currency"];

export async function PUT(req: NextRequest) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") return bad("بيانات غير صالحة");
  if (typeof b.currency === "string" && !b.currency.trim()) return bad("العملة مطلوبة");
  for (const k of ADMIN_SETTING_KEYS) {
    const v = b[k];
    if (typeof v !== "string" || v.length > 1000) continue;
    setSetting(k, v.trim());
  }
  if (b.announce_config !== undefined) {
    const c = sanitizeAnnounce(b.announce_config);
    if (c.start && c.end && c.start >= c.end) return bad("تاريخ بداية الشريط يجب أن يسبق تاريخ نهايته");
    setSetting("announce_config", JSON.stringify(c));
    setSetting("announcement", legacyText(c)); // توافق مع التطبيقات القديمة
  }
  return NextResponse.json({ ok: true });
}
