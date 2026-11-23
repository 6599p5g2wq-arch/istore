import { NextResponse } from "next/server";
import { logoIconPng } from "@/lib/favicon";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  const png = await logoIconPng(180);
  if (!png) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=0, must-revalidate" } });
}
