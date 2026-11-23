import sharp from "sharp";
import { getSetting } from "@/lib/settings";

const cache = new Map<string, Buffer>();

// أيقونة PNG مربعة (شفافة) من الشعار المخزَّن، بالحجم المطلوب
export async function logoIconPng(size: number): Promise<Buffer | null> {
  const v = getSetting("intro_logo", "");
  const m = /^data:image\/[a-z+]+;base64,([A-Za-z0-9+/=]+)$/.exec(v);
  if (!m) return null;
  const key = `${size}:${v.length}:${v.slice(-40)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const out = await sharp(Buffer.from(m[1], "base64"))
    .resize({ width: size, height: size, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  if (cache.size > 12) cache.clear();
  cache.set(key, out);
  return out;
}

export function iconHash(): string {
  const v = getSetting("intro_logo", "");
  if (!v) return "";
  let h = 0;
  for (let i = 0; i < v.length; i += 7) h = (h * 31 + v.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + v.length.toString(36);
}
