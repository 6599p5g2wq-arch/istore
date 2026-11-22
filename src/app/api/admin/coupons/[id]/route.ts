import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const db = getDb();
  if (!db.prepare("SELECT id FROM coupons WHERE id = ?").get(params.id)) return bad("الكوبون غير موجود", 404);
  db.prepare("UPDATE coupons SET active = ? WHERE id = ?").run(b.active ? 1 : 0, params.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const db = getDb();
  db.prepare("DELETE FROM coupons WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
