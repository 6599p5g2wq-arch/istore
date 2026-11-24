import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = (await requireAdmin());if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const db = getDb();
  db.prepare("UPDATE cart_leads SET reminded = ? WHERE id = ?").run(b.reminded ? 1 : 0, params.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = (await requireAdmin());if (auth) return auth;
  const db = getDb();
  db.prepare("DELETE FROM cart_leads WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
