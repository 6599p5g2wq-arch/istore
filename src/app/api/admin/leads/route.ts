import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

// Bulk cleanup: DELETE /api/admin/leads?days=30 removes leads not updated for N days.
export async function DELETE(req: NextRequest) {
  const auth = (await requireAdmin()); if (auth) return auth;
  const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get("days")) || 30));
  const db = getDb();
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 19).replace("T", " ");
  const r = db.prepare("DELETE FROM cart_leads WHERE updated_at < ?").run(cutoff);
  if (r.changes === 0) return bad("لا توجد سلات أقدم من هذه المدة");
  return NextResponse.json({ ok: true, deleted: r.changes });
}
