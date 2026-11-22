import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdmin, createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!username || !password) return NextResponse.json({ error: "أدخل اسم المستخدم وكلمة المرور" }, { status: 400 });
  const adminId = verifyAdmin(String(username), String(password));
  if (!adminId) return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  const token = createSession(adminId);
  cookies().set("admin_session", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return NextResponse.json({ ok: true });
}
