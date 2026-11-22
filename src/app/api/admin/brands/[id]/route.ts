import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const db = getDb();
  db.prepare("UPDATE brands SET name=?, slug=?, image=?, sort_order=?, active=? WHERE id=?")
    .run(b.name?.trim() || "", b.slug?.trim() || "", b.image || "", Number(b.sort_order) || 0, b.active ? 1 : 0, params.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const db = getDb();
  const used = (db.prepare("SELECT COUNT(*) c FROM products WHERE brand_id = ?").get(params.id) as { c: number }).c;
  if (used > 0) return bad(`لا يمكن حذف الماركة: مرتبطة بـ ${used} منتج. انقل المنتجات لماركة أخرى أولاً.`);
  db.prepare("DELETE FROM brands WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
