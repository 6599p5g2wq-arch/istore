import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ results: [] });
  const db = getDb();
  const results = db.prepare(
    "SELECT id, name, slug, price, image FROM products WHERE active = 1 AND (name LIKE ? OR description LIKE ?) LIMIT 8"
  ).all(`%${q}%`, `%${q}%`);
  return NextResponse.json({ results });
}
