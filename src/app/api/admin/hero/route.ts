import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = (await requireAdmin()); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  if (!b.title?.trim()) return bad("العنوان مطلوب");
  const r = getDb().prepare("INSERT INTO hero_slides (title, subtitle, cta_text, cta_link, image, theme, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(b.title.trim(), b.subtitle || "", b.cta_text || "تسوق الآن", b.cta_link || "/products", b.image || "", b.theme || "dark", Number(b.sort_order) || 99);
  return NextResponse.json({ ok: true, id: Number(r.lastInsertRowid) });
}
