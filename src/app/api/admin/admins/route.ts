import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, bad } from "@/lib/admin-api";
import { createAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  if (typeof b.username!=="string" || !b.username.trim() || !b.password) return bad("اسم المستخدم وكلمة المرور مطلوبان");
  if (String(b.password).length < 6) return bad("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
  if(b.username.trim().length>100)return bad("اسم المستخدم طويل جداً");
  if(b.confirm_password!==undefined && b.password!==b.confirm_password)return bad("كلمتا المرور غير متطابقتين");
  const db = getDb();
  if (db.prepare("SELECT id FROM admin_users WHERE username = ?").get(b.username.trim())) return bad("اسم المستخدم موجود مسبقاً");
  createAdmin(b.username.trim(), String(b.password));
  return NextResponse.json({ ok: true });
}
