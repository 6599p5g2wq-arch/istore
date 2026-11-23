import type { NextRequest } from "next/server";

// حد محاولات بسيط في الذاكرة (يكفي لخادم واحد): max محاولات خلال windowMs لكل مفتاح
const hits = new Map<string, { count: number; resetAt: number }>();

export function clientIp(req: NextRequest): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
}

export function tooMany(key: string, max = 8, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.resetAt < now) { hits.set(key, { count: 1, resetAt: now + windowMs }); return false; }
  h.count++;
  return h.count > max;
}

export function resetLimit(key: string) { hits.delete(key); }
