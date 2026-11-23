import sharp from "sharp";
import { createHash } from "crypto";
import type { Metadata } from "next";
import { getSetting } from "@/lib/settings";

const cache = new Map<string, Buffer>();

// أيقونة PNG مربعة (شفافة) من الشعار المخزَّن، بالحجم المطلوب
export async function logoIconPng(size: number): Promise<Buffer | null> {
  const v = getSetting("intro_logo", "");
  const m = /^data:image\/[a-z+]+;base64,([A-Za-z0-9+/=]+)$/.exec(v);
  if (!m) return null;
  const key = `${size}:${iconHash()}`;
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
  return createHash("sha256").update(v).digest("hex").slice(0, 16);
}

export function logoIcons(): Metadata["icons"] {
  const h = iconHash();
  if (!h) return undefined;
  return {
    icon: [
      { url: `/favicon.ico?v=${h}`, type: "image/x-icon", sizes: "48x48" },
      { url: `/favicon.png?s=32&v=${h}`, type: "image/png", sizes: "32x32" },
      { url: `/favicon.png?s=192&v=${h}`, type: "image/png", sizes: "192x192" },
    ],
    shortcut: `/favicon.ico?v=${h}`,
    apple: [{ url: `/apple-touch-icon.png?v=${h}`, sizes: "180x180", type: "image/png" }],
  };
}

export function pngToIco(png: Buffer, size = 48): Buffer {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header[6] = size;
  header[7] = size;
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, png]);
}
