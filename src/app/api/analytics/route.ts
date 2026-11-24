import {clientIp,tooMany} from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (tooMany("analytics:"+clientIp(req),120)) return NextResponse.json({error:"محاولات كثيرة، حاول لاحقا"},{status:429});
  const b = await req.json().catch(() => ({}));
  const path = String(b.path || "").slice(0, 200);
  if (!path || path.startsWith("/admin") || path.startsWith("/api")) return NextResponse.json({ ok: false });
  const referrer = String(b.referrer || "").slice(0, 300);
  const db = getDb();
  db.prepare("INSERT INTO page_views (path, referrer) VALUES (?, ?)").run(path, referrer);
  return NextResponse.json({ ok: true });
}
