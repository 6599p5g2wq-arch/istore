import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import sharp from "sharp";
import { getControlSession } from "@/lib/control-auth";
import { getSetting, setSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const dir = () => path.join(process.cwd(), "public", "uploads");

function removeOld() {
  const old = getSetting("intro_logo", "");
  if (old.startsWith("/uploads/intro-logo-")) {
    try { fs.unlinkSync(path.join(dir(), path.basename(old))); } catch {}
  }
}

export async function POST(req: NextRequest) {
  if (!getControlSession()) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  if (!file || typeof file === "string") return NextResponse.json({ error: "لم يتم إرفاق ملف" }, { status: 400 });
  if (!TYPES.includes(file.type)) return NextResponse.json({ error: "الصيغة غير مدعومة (PNG, JPG, WebP, SVG فقط)" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "حجم الملف يتجاوز 5MB" }, { status: 400 });
  try {
    // يُحوَّل كل شيء (بما فيه SVG) إلى WebP شفاف بأقصى عرض 640 مع تنعيم خفيف:
    // أخف وزناً، ولا يمكن لملف SVG أن ينفذ سكربتاً لأنه يتحول لصورة نقطية.
    const input = Buffer.from(await file.arrayBuffer());
    const out = await sharp(input, { density: 300, limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: file.type !== "image/svg+xml" })
      .ensureAlpha()
      .blur(1.2)
      .webp({ quality: 80, alphaQuality: 90 })
      .toBuffer();
    fs.mkdirSync(dir(), { recursive: true });
    removeOld();
    const name = `intro-logo-${Date.now()}-${crypto.randomBytes(3).toString("hex")}.webp`;
    fs.writeFileSync(path.join(dir(), name), out);
    setSetting("intro_logo", `/uploads/${name}`);
    return NextResponse.json({ ok: true, path: `/uploads/${name}`, bytes: out.length });
  } catch {
    return NextResponse.json({ error: "تعذّرت معالجة الصورة، جرّب ملفاً آخر" }, { status: 400 });
  }
}

export async function DELETE() {
  if (!getControlSession()) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  removeOld();
  setSetting("intro_logo", "");
  return NextResponse.json({ ok: true });
}
