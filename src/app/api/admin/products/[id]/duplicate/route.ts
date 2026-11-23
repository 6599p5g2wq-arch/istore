import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const db = getDb();
  const p = db.prepare("SELECT * FROM products WHERE id = ?").get(params.id) as Record<string, unknown> | undefined;
  if (!p) return bad("المنتج غير موجود", 404);

  // slug فريد للنسخة
  let slug = `${String(p.slug)}-copy`;
  let n = 2;
  while (db.prepare("SELECT id FROM products WHERE slug = ?").get(slug)) slug = `${String(p.slug)}-copy-${n++}`;

  const r = db.prepare(
    `INSERT INTO products (name, slug, category_id, brand_id, description, price, old_price, stock, image, images, badge, featured, active, rating, options)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    `${String(p.name)} (نسخة)`, slug, p.category_id ?? null, p.brand_id ?? null, p.description ?? "",
    p.price ?? 0, p.old_price ?? null, p.stock ?? 0, p.image ?? "", p.images ?? "[]",
    p.badge ?? "", 0, 0, p.rating ?? 4.8, p.options ?? "[]"
  );
  const newId = Number(r.lastInsertRowid);

  // نسخ المتغيرات إن وجدت
  const variants = db.prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order, id").all(params.id) as Record<string, unknown>[];
  const ins = db.prepare("INSERT INTO product_variants (product_id, label, options, price, stock, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)");
  for (const v of variants) ins.run(newId, v.label ?? "", v.options ?? "{}", v.price ?? null, v.stock ?? 0, v.image ?? "", v.sort_order ?? 0);

  return NextResponse.json({ ok: true, id: newId });
}
