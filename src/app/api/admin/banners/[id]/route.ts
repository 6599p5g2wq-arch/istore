import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = (await requireAdmin());if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  if (!b.title?.trim()) return bad("العنوان مطلوب");
  getDb().prepare("UPDATE banners SET title=?, subtitle=?, image=?, link=?, sort_order=?, active=? WHERE id=?")
    .run(b.title.trim(), b.subtitle || "", b.image || "", b.link || "/products", Number(b.sort_order) || 99, b.active ? 1 : 0, params.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = (await requireAdmin());if (auth) return auth;
  getDb().prepare("DELETE FROM banners WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
