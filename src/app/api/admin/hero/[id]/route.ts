import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  if (!b.title?.trim()) return bad("العنوان مطلوب");
  getDb().prepare("UPDATE hero_slides SET title=?, subtitle=?, cta_text=?, cta_link=?, image=?, theme=?, sort_order=?, active=? WHERE id=?")
    .run(b.title || "", b.subtitle || "", b.cta_text || "تسوق الآن", b.cta_link || "/products", b.image || "", b.theme || "dark", Number(b.sort_order) || 99, b.active ? 1 : 0, params.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const db = getDb();
  if (typeof b.active === "boolean") {
    db.prepare("UPDATE hero_slides SET active = ? WHERE id = ?").run(b.active ? 1 : 0, params.id);
    return NextResponse.json({ ok: true });
  }
  if (b.move === "up" || b.move === "down") {
    const ids = (db.prepare("SELECT id FROM hero_slides ORDER BY sort_order, id").all() as { id: number }[]).map((r) => r.id);
    const i = ids.indexOf(Number(params.id));
    if (i === -1) return bad("الشريحة غير موجودة");
    const j = b.move === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= ids.length) return NextResponse.json({ ok: true });
    // إعادة ترقيم متسلسلة ثم تبديل الجارين
    ids.forEach((id, k) => db.prepare("UPDATE hero_slides SET sort_order = ? WHERE id = ?").run((k + 1) * 10, id));
    [ids[i], ids[j]] = [ids[j], ids[i]];
    db.prepare("UPDATE hero_slides SET sort_order = ? WHERE id = ?").run((j + 1) * 10, ids[j]);
    db.prepare("UPDATE hero_slides SET sort_order = ? WHERE id = ?").run((i + 1) * 10, ids[i]);
    return NextResponse.json({ ok: true });
  }
  return bad("عملية غير معروفة");
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  getDb().prepare("DELETE FROM hero_slides WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
