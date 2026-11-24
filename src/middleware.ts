import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/") && Number(req.headers.get("content-length")||0)>12*1024*1024) return NextResponse.json({error:"الطلب كبير جدا"},{status:413});
  if (req.nextUrl.pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    let valid = false;
    try { if (origin) valid = new URL(origin).host === host; } catch { valid = false; }
    if (!valid || req.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({error:"طلب غير مسموح"},{status:403});
  }
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Cache-Control", "no-store");
  return res;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"] };
