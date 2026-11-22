import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** Records a checkout that started (phone captured) but was never completed. */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const phone = (b.phone || "").trim();
  const items = Array.isArray(b.items) ? b.items.slice(0, 30) : [];
  const total = Number(b.total) || 0;
  if (!/^[\d+\s-]{8,}$/.test(phone) || items.length === 0) return bad("بيانات غير مكتملة");
  const db = getDb();
  db.prepare(
    `INSERT INTO cart_leads (phone, items, total, updated_at) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(phone) DO UPDATE SET items = excluded.items, total = excluded.total, reminded = 0, updated_at = datetime('now')`
  ).run(phone, JSON.stringify(items), total);
  return NextResponse.json({ ok: true });
}
