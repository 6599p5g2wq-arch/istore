import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const db = getDb();
  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(params.id);
  if (!existing) return bad("المنتج غير موجود", 404);
  const dup = db.prepare("SELECT id FROM products WHERE slug = ? AND id != ?").get(b.slug?.trim() || "", params.id);
  if (dup) return bad("هذا الـ slug مستخدم مسبقاً");
  db.prepare(
    `UPDATE products SET name=?, slug=?, category_id=?, description=?, price=?, old_price=?, stock=?, image=?, images=?, badge=?, featured=?, active=?, rating=? WHERE id=?`
  ).run(
    b.name?.trim() || "", b.slug?.trim() || "", b.category_id || null, b.description || "",
    Number(b.price) || 0, b.old_price ? Number(b.old_price) : null, Number(b.stock) || 0,
    b.image || "", JSON.stringify(Array.isArray(b.images) ? b.images : []),
    b.badge || "", b.featured ? 1 : 0, b.active ? 1 : 0, Number(b.rating) || 4.8, params.id
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const db = getDb();
  db.prepare("DELETE FROM products WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
