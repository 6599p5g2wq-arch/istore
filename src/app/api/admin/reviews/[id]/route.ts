import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const db = getDb();
  const row = db.prepare("SELECT product_id FROM reviews WHERE id = ?").get(params.id) as { product_id: number } | undefined;
  db.prepare("DELETE FROM reviews WHERE id = ?").run(params.id);
  if (row) {
    db.prepare(
      `UPDATE products SET rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = ? AND approved = 1), rating) WHERE id = ?`
    ).run(row.product_id, row.product_id);
  }
  return NextResponse.json({ ok: true });
}
