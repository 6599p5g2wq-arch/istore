import { NextRequest, NextResponse } from "next/server";
import { verifyControl, setControlCookie } from "@/lib/control-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!username || !password) return NextResponse.json({ error: "أدخل اسم المستخدم وكلمة المرور" }, { status: 400 });
  if (!verifyControl(String(username), String(password))) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }
  setControlCookie();
  return NextResponse.json({ ok: true });
}
