import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

const ACTIONS: Record<string, string> = {
  activate: "UPDATE products SET active = 1",
  hide: "UPDATE products SET active = 0",
  feature: "UPDATE products SET featured = 1",
  unfeature: "UPDATE products SET featured = 0",
};

export async function POST(req: NextRequest) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const sql = ACTIONS[String(b.action || "")];
  if (!sql) return bad("إجراء غير معروف");
  const ids = Array.isArray(b.ids) ? Array.from(new Set(b.ids.map((x: unknown) => Math.floor(Number(x))).filter((n: number) => n > 0))).slice(0, 500) : [];
  if (ids.length === 0) return bad("لم يتم تحديد أي منتج");
  const db = getDb();
  const r = db.prepare(`${sql} WHERE id IN (${ids.map(() => "?").join(",")})`).run(...ids);
  return NextResponse.json({ ok: true, updated: r.changes });
}
