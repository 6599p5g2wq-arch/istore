import { NextRequest, NextResponse } from "next/server";
import { clientIp, tooMany } from "@/lib/rate-limit";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if(q.length>120)return NextResponse.json({error:"البحث طويل جداً"},{status:400});
  if(q&&tooMany("search:"+clientIp(req),120,60_000))return NextResponse.json({error:"محاولات كثيرة، انتظر قليلاً"},{status:429});
  if (!q) return NextResponse.json({ results: [] });
  const db = getDb();
  const results = db.prepare(
    "SELECT id, name, slug, price, image FROM products WHERE active = 1 AND (name LIKE ? OR description LIKE ?) ORDER BY id ASC LIMIT 8"
  ).all(`%${q}%`, `%${q}%`);
  return NextResponse.json({ results });
}
