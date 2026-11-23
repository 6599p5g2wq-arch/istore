import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { sendTelegram } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = requireAdmin(); if (auth) return auth;
  const ok = await sendTelegram("✅ رسالة تجريبية: إشعارات طلبات آي ستور تعمل بنجاح.");
  return NextResponse.json({ ok }, { status: ok ? 200 : 502 });
}
