import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    let valid = !origin;
    try { if (origin) valid = new URL(origin).host === host; } catch { valid = false; }
    if (!valid || req.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({error:"طلب غير مسموح"},{status:403});
  }
  return NextResponse.next();
}
export const config = { matcher: "/api/:path*" };
