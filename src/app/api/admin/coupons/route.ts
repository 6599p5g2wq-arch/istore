import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const code = (b.code || "").trim().toUpperCase();
  if (!code || code.length > 40) return bad("كود الخصم مطلوب");
  if (!["percent", "fixed"].includes(b.kind)) return bad("نوع الخصم غير صالح");
  const value = Number(b.value) || 0;
  if (value <= 0 || (b.kind === "percent" && value > 90)) return bad("قيمة الخصم غير صالحة");
  const db = getDb();
  if (db.prepare("SELECT id FROM coupons WHERE UPPER(code) = ?").get(code)) return bad("هذا الكود موجود مسبقاً");
  const startsAt = (b.starts_at || "").trim();
  const expiresAt = (b.expires_at || "").trim();
  if (startsAt && expiresAt && startsAt > expiresAt) return bad("تاريخ البداية بعد تاريخ الانتهاء");
  const maxUses = Math.max(0, Math.floor(Number(b.max_uses) || 0));
  const r = db.prepare("INSERT INTO coupons (code, kind, value, min_total, expires_at, starts_at, max_uses) VALUES (?, ?, ?, ?, ?, ?, ?)").run(code, b.kind, value, Number(b.min_total) || 0, expiresAt, startsAt, maxUses);
  return NextResponse.json({ ok: true, id: Number(r.lastInsertRowid) });
}
