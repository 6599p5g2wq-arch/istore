import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import sharp from "sharp";
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
  const input=Buffer.from(await file.arrayBuffer());
  try { const meta=await sharp(input,{limitInputPixels:40_000_000}).metadata();
    const expected:Record<string,string>={"image/jpeg":"jpeg","image/png":"png","image/webp":"webp","image/avif":"heif"};
    if(meta.format!==expected[file.type] || !meta.width || !meta.height || meta.width*meta.height>40_000_000 || (meta.pages||1)>1) return bad("ملف صورة غير صالح");
  } catch { return bad("ملف صورة غير صالح"); }
  const dir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
  fs.writeFileSync(path.join(dir, name), input);
  return NextResponse.json({ ok: true, path: `/uploads/${name}` });
}
