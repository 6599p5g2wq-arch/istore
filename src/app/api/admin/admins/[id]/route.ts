import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {revokePrincipal} from "@/lib/security";
import { requireAdmin, bad } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { getSessionAdmin, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = (await requireAdmin());if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  if (!b.password || String(b.password).length < 6) return bad("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
  const db = getDb();
  if(b.confirm_password!==undefined && b.password!==b.confirm_password)return bad("كلمتا المرور غير متطابقتين");
  if(!db.prepare("SELECT id FROM admin_users WHERE id=?").get(params.id))return bad("المشرف غير موجود",404);
  const self=(await getSessionAdmin())?.id===Number(params.id);
  const salt = crypto.randomBytes(16).toString("hex");
  db.prepare("UPDATE admin_users SET pass_hash = ?, salt = ? WHERE id = ?").run(hashPassword(String(b.password), salt), salt, params.id);
  db.prepare("DELETE FROM sessions WHERE admin_id = ?").run(params.id);
  revokePrincipal("admin",params.id);
  return NextResponse.json({ ok: true, relogin: self });
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = (await requireAdmin());if (auth) return auth;
  const db = getDb();
  if((await getSessionAdmin())?.id===Number(params.id))return bad("لا يمكنك حذف حسابك الحالي");
  if(!db.prepare("SELECT id FROM admin_users WHERE id=?").get(params.id))return bad("المشرف غير موجود",404);
  const count = (db.prepare("SELECT COUNT(*) c FROM admin_users").get() as { c: number }).c;
  if (count <= 1) return bad("لا يمكن حذف آخر مشرف");
  revokePrincipal("admin",params.id);
  db.prepare("DELETE FROM admin_users WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
