import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  if (!b.name?.trim() || !b.slug?.trim()) return bad("الاسم والـ slug مطلوبان");
  const db = getDb();
  if (db.prepare("SELECT id FROM brands WHERE slug = ?").get(b.slug.trim())) return bad("هذا الـ slug مستخدم مسبقاً");
  const r = db.prepare("INSERT INTO brands (name, slug, description, image, sort_order) VALUES (?, ?, ?, ?, ?)")
    .run(b.name.trim(), b.slug.trim(), b.description || "", b.image || "", Number(b.sort_order) || 0);
  return NextResponse.json({ ok: true, id: Number(r.lastInsertRowid) });
}
