import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

function recompute(db: ReturnType<typeof getDb>, productId: number) {
  db.prepare(
    `UPDATE products SET rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = ? AND approved = 1), rating) WHERE id = ?`
  ).run(productId, productId);
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = (await requireAdmin());if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const db = getDb();
  const row = db.prepare("SELECT product_id FROM reviews WHERE id = ?").get(params.id) as { product_id: number } | undefined;
  if (!row) return bad("التقييم غير موجود", 404);
  if (b.reply !== undefined) {
    db.prepare("UPDATE reviews SET reply = ? WHERE id = ?").run(String(b.reply).trim().slice(0, 500), params.id);
    return NextResponse.json({ ok: true });
  }
  db.prepare("UPDATE reviews SET approved = ? WHERE id = ?").run(b.approved ? 1 : 0, params.id);
  recompute(db, row.product_id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = (await requireAdmin());if (auth) return auth;
  const db = getDb();
  const row = db.prepare("SELECT product_id FROM reviews WHERE id = ?").get(params.id) as { product_id: number } | undefined;
  db.prepare("DELETE FROM reviews WHERE id = ?").run(params.id);
  if (row) recompute(db, row.product_id);
  return NextResponse.json({ ok: true });
}
