import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

const ALLOWED: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif" };

export async function POST(req: NextRequest) {
  const auth = (await requireAdmin()); if (auth) return auth;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  if (!file || typeof file === "string") return bad("لم يتم إرفاق ملف");
  const ext = ALLOWED[file.type];
  if (!ext) return bad("صيغة الصورة غير مدعومة (JPG, PNG, WebP, AVIF فقط)");
  if (file.size > 5 * 1024 * 1024) return bad("حجم الصورة يتجاوز 5MB");
  const dir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
  fs.writeFileSync(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ ok: true, path: `/uploads/${name}` });
}
