import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const db = getDb();
  db.prepare("UPDATE cities SET name=?, fee=?, active=?, sort_order=? WHERE id=?")
    .run(b.name?.trim() || "", Number(b.fee) || 0, b.active ? 1 : 0, Number(b.sort_order) || 99, params.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  getDb().prepare("DELETE FROM cities WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
