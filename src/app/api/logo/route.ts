import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// يخدم شعار المتجر المخزَّن كـ data URL في قاعدة البيانات كصورة عادية قابلة للتخزين المؤقت
// (يُستخدم في الهيدر حتى لا تُحمَّل بيانات الصورة داخل HTML كل صفحة). المعامل v يتغير مع تغيّر الشعار.
export async function GET() {
  const v = getSetting("intro_logo", "");
  const m = /^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(v);
  if (!m) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(m[2], "base64"), {
    headers: { "Content-Type": m[1], "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
