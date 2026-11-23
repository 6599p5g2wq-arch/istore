import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";
import { replaceVariants, parseOptions } from "@/lib/variants";
import { sendStockAlert } from "@/lib/notify";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const db = getDb();
  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(params.id);
  if (!existing) return bad("المنتج غير موجود", 404);
  const dup = db.prepare("SELECT id FROM products WHERE slug = ? AND id != ?").get(b.slug?.trim() || "", params.id);
  if (dup) return bad("هذا الـ slug مستخدم مسبقاً");
  const prev = db.prepare("SELECT stock FROM products WHERE id = ?").get(params.id) as { stock: number };
  const newStock = Number(b.stock) || 0;
  const optionsJson = JSON.stringify(parseOptions(JSON.stringify(Array.isArray(b.options) ? b.options : [])));
  db.prepare(
    `UPDATE products SET name=?, slug=?, category_id=?, brand_id=?, description=?, price=?, old_price=?, stock=?, image=?, images=?, badge=?, featured=?, active=?, rating=?, options=? WHERE id=?`
  ).run(
    b.name?.trim() || "", b.slug?.trim() || "", b.category_id || null, b.brand_id || null, b.description || "",
    Number(b.price) || 0, b.old_price ? Number(b.old_price) : null, newStock,
    b.image || "", JSON.stringify(Array.isArray(b.images) ? b.images : []),
    b.badge || "", b.featured ? 1 : 0, b.active ? 1 : 0, Number(b.rating) || 4.8, optionsJson, params.id
  );
  replaceVariants(db, Number(params.id), optionsJson, Array.isArray(b.variants) ? b.variants : []);
  // Back-in-stock: notify everyone waiting when stock returns.
  if (prev.stock <= 0 && newStock > 0) {
    const waiting = db.prepare("SELECT id, contact FROM stock_alerts WHERE product_id = ? AND notified = 0").all(params.id) as { id: number; contact: string }[];
    if (waiting.length > 0) {
      const base = getSetting("site_url", "").replace(/\/$/, "");
      const url = `${base}/product/${b.slug?.trim() || ""}`;
      Promise.allSettled(waiting.map((w) => sendStockAlert(w.contact, b.name?.trim() || "منتج", url))).then(() => {
        const mark = db.prepare("UPDATE stock_alerts SET notified = 1 WHERE id = ?");
        for (const w of waiting) mark.run(w.id);
      }).catch(() => {});
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const db = getDb();
  db.prepare("DELETE FROM products WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const field = String(b.field || "");
  if (field !== "active" && field !== "featured") return bad("حقل غير مسموح");
  const db = getDb();
  const r = db.prepare(`UPDATE products SET ${field} = ? WHERE id = ?`).run(b.value ? 1 : 0, params.id);
  if (r.changes === 0) return bad("المنتج غير موجود", 404);
  return NextResponse.json({ ok: true });
}
