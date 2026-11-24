import { NextRequest, NextResponse } from "next/server";
import { getControlSession } from "@/lib/control-auth";
import { setSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  if (!(await getControlSession())) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (typeof b !== "object" || !b) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  const mu = (b as Record<string, unknown>).map_url;
  if (typeof mu === "string" && mu.trim()) {
    let ok = false;
    try { const u = new URL(mu.trim()); ok = u.protocol === "https:" || u.protocol === "http:"; } catch {}
    if (!ok) return NextResponse.json({ error: "رابط الخريطة غير صالح: يجب أن يبدأ بـ https://" }, { status: 400 });
    (b as Record<string, unknown>).map_url = mu.trim();
  }
  for (const [k, v] of Object.entries(b)) {
    if ((k === "resend_api_key" || k === "telegram_bot_token") && typeof v === "string" && !v.trim()) continue;
    if (typeof v === "string" && k.length <= 60 && v.length <= 5000) setSetting(k, v);
  }
  return NextResponse.json({ ok: true });
}
