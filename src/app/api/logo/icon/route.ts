import { NextRequest, NextResponse } from "next/server";
import { logoIconPng } from "@/lib/favicon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const s = Number(req.nextUrl.searchParams.get("s")) || 32;
  const size = [16, 32, 48, 64, 96, 180, 192, 512].includes(s) ? s : 32;
  const png = await logoIconPng(size);
  if (!png) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=0, must-revalidate" } });
}
