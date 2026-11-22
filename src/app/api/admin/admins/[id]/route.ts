import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin, bad } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  if (!b.password || String(b.password).length < 6) return bad("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
  const db = getDb();
  const salt = crypto.randomBytes(16).toString("hex");
  db.prepare("UPDATE admin_users SET pass_hash = ?, salt = ? WHERE id = ?").run(hashPassword(String(b.password), salt), salt, params.id);
  db.prepare("DELETE FROM sessions WHERE admin_id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) c FROM admin_users").get() as { c: number }).c;
  if (count <= 1) return bad("لا يمكن حذف آخر مشرف");
  db.prepare("DELETE FROM admin_users WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
