import { NextResponse } from "next/server";
import { sendTelegram } from "@/lib/telegram";

export async function POST() {
  const ok = await sendTelegram("✅ رسالة تجريبية: إشعارات طلبات آي ستور تعمل بنجاح.");
  return NextResponse.json({ ok }, { status: ok ? 200 : 502 });
}
