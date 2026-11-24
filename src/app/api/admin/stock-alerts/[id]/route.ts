import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = (await requireAdmin());if (auth) return auth;
  const db = getDb();
  db.prepare("DELETE FROM stock_alerts WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
