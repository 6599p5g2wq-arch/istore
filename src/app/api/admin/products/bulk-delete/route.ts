import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const ids = Array.isArray(b.ids) ? Array.from(new Set(b.ids.map((x: unknown) => Math.floor(Number(x))).filter((n: number) => n > 0))).slice(0, 500) : [];
  if (ids.length === 0) return bad("لم يتم تحديد أي منتج");
  const db = getDb();
  const placeholders = ids.map(() => "?").join(",");
  const r = db.prepare(`DELETE FROM products WHERE id IN (${placeholders})`).run(...ids);
  return NextResponse.json({ ok: true, deleted: r.changes });
}
