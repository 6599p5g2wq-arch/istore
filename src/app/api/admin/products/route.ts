import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";
import { replaceVariants, parseOptions } from "@/lib/variants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  if (!b.name?.trim() || !b.slug?.trim()) return bad("الاسم والرابط (slug) مطلوبان");
  const db = getDb();
  const dup = db.prepare("SELECT id FROM products WHERE slug = ?").get(b.slug.trim());
  if (dup) return bad("هذا الـ slug مستخدم مسبقاً");
  const optionsJson = JSON.stringify(parseOptions(JSON.stringify(Array.isArray(b.options) ? b.options : [])));
  const r = db.prepare(
    `INSERT INTO products (name, slug, category_id, brand_id, description, price, old_price, stock, image, images, badge, featured, active, rating, options)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    b.name.trim(), b.slug.trim(), b.category_id || null, b.brand_id || null, b.description || "",
    Number(b.price) || 0, b.old_price ? Number(b.old_price) : null, Number(b.stock) || 0,
    b.image || "", JSON.stringify(Array.isArray(b.images) ? b.images : []),
    b.badge || "", b.featured ? 1 : 0, b.active === false ? 0 : 1, Number(b.rating) || 4.8, optionsJson
  );
  const id = Number(r.lastInsertRowid);
  replaceVariants(db, id, optionsJson, Array.isArray(b.variants) ? b.variants : []);
  return NextResponse.json({ ok: true, id });
}
