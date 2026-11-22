import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  getDb().prepare("UPDATE hero_slides SET title=?, subtitle=?, cta_text=?, cta_link=?, image=?, theme=?, sort_order=?, active=? WHERE id=?")
    .run(b.title || "", b.subtitle || "", b.cta_text || "تسوق الآن", b.cta_link || "/products", b.image || "", b.theme || "dark", Number(b.sort_order) || 99, b.active ? 1 : 0, params.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  getDb().prepare("DELETE FROM hero_slides WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
