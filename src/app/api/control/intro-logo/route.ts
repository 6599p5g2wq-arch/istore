import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getControlSession } from "@/lib/control-auth";
import { setSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function removeOld() {
  // لا ملفات للحذف: الشعار داخل قاعدة البيانات
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
    let out = await sharp(input, { density: 300, limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: file.type !== "image/svg+xml" })
      .ensureAlpha()
      .blur(1.2)
      .webp({ quality: 80, alphaQuality: 90 })
      .toBuffer();
    // يُخزَّن كـ data URL داخل قاعدة البيانات: لا يعتمد على ملفات وقت التشغيل (غير مخدومة على Render)
    const dataUrl = `data:image/webp;base64,${out.toString("base64")}`;
    setSetting("intro_logo", dataUrl);
    return NextResponse.json({ ok: true, path: dataUrl, bytes: out.length });
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
