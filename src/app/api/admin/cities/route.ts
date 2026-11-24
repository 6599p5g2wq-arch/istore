import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  if (!b.name?.trim()) return bad("اسم المدينة مطلوب");
  if (!Number.isFinite(Number(b.fee)) || Number(b.fee)<0) return bad("رسوم التوصيل يجب أن تكون رقماً غير سالب");
  const db = getDb();
  if (db.prepare("SELECT id FROM cities WHERE name = ?").get(b.name.trim())) return bad("هذه المدينة مضافة مسبقاً");
  const r = db.prepare("INSERT INTO cities (name, fee, sort_order) VALUES (?, ?, ?)").run(b.name.trim(), Number(b.fee) || 0, Number(b.sort_order) || 99);
  return NextResponse.json({ ok: true, id: Number(r.lastInsertRowid) });
}
