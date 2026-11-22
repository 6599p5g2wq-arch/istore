import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  if (!b.title?.trim()) return bad("العنوان مطلوب");
  const r = getDb().prepare("INSERT INTO banners (title, subtitle, image, link, sort_order) VALUES (?, ?, ?, ?, ?)")
    .run(b.title.trim(), b.subtitle || "", b.image || "", b.link || "/products", Number(b.sort_order) || 99);
  return NextResponse.json({ ok: true, id: Number(r.lastInsertRowid) });
}
