import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = (await requireAdmin());if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const db = getDb();
  if (typeof b.name!=="string" || !b.name.trim() || typeof b.slug!=="string" || !b.slug.trim()) return bad("الاسم والرابط مطلوبان");
  if (!db.prepare("SELECT id FROM categories WHERE id=?").get(params.id)) return bad("العنصر غير موجود",404);
  if (db.prepare("SELECT id FROM categories WHERE slug=? AND id!=?").get(b.slug.trim(),params.id)) return bad("هذا الرابط مستخدم مسبقاً");

  db.prepare("UPDATE categories SET name=?, slug=?, description=?, image=?, sort_order=?, active=? WHERE id=?")
    .run(b.name?.trim() || "", b.slug?.trim() || "", b.description || "", b.image || "", Number(b.sort_order) || 0, b.active ? 1 : 0, params.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = (await requireAdmin());if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const db = getDb();
  if (typeof b.active === "boolean") {
    db.prepare("UPDATE categories SET active = ? WHERE id = ?").run(b.active ? 1 : 0, params.id);
    return NextResponse.json({ ok: true });
  }
  if (b.move === "up" || b.move === "down") {
    const rows = db.prepare("SELECT id FROM categories ORDER BY sort_order, id").all() as { id: number }[];
    const ids = rows.map((r) => r.id);
    const i = ids.indexOf(Number(params.id));
    if (i === -1) return bad("التصنيف غير موجود");
    const j = b.move === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= ids.length) return NextResponse.json({ ok: true });
    // إعادة ترقيم متسلسلة ثم تبديل الجارين
    ids.forEach((id, k) => db.prepare("UPDATE categories SET sort_order = ? WHERE id = ?").run((k + 1) * 10, id));
    [ids[i], ids[j]] = [ids[j], ids[i]];
    db.prepare("UPDATE categories SET sort_order = ? WHERE id = ?").run((j + 1) * 10, ids[j]);
    db.prepare("UPDATE categories SET sort_order = ? WHERE id = ?").run((i + 1) * 10, ids[i]);
    return NextResponse.json({ ok: true });
  }
  return bad("عملية غير معروفة");
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = (await requireAdmin());if (auth) return auth;
  const db = getDb();
  const used = (db.prepare("SELECT COUNT(*) c FROM products WHERE category_id = ?").get(params.id) as { c: number }).c;
  if (used > 0) {
    const raw = new URL(req.url).searchParams.get("reassign");
    if (raw === null) return bad(`لا يمكن حذف التصنيف: مرتبط بـ ${used} منتج. اختر نقلها لتصنيف آخر أو بدون تصنيف.`);
    if (raw === "" || raw === "0") {
      db.prepare("UPDATE products SET category_id = NULL WHERE category_id = ?").run(params.id);
    } else {
      const target = db.prepare("SELECT id FROM categories WHERE id = ? AND id != ?").get(Number(raw), params.id);
      if (!target) return bad("التصنيف البديل غير موجود");
      db.prepare("UPDATE products SET category_id = ? WHERE category_id = ?").run(Number(raw), params.id);
    }
  }
  db.prepare("DELETE FROM categories WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
