import { NextResponse } from "next/server";
import { logoIconPng } from "@/lib/favicon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// المتصفحات تطلب /favicon.ico تلقائياً؛ نخدم أيقونة الشعار (PNG) وإلا 404
export async function GET() {
  const png = await logoIconPng(48);
  if (!png) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" } });
}
