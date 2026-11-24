import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = (await requireAdmin()); if (auth) return auth;
  const db = getDb();
  const r = db.prepare("DELETE FROM stock_alerts WHERE notified = 1").run();
  return NextResponse.json({ ok: true, deleted: r.changes });
}
