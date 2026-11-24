import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";
import { PROGRAM_FIELDS } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

// group: welcome | loyalty | vip — يحفظ مفتاح التفعيل والقيم ضمن حدود مسموحة فقط
export async function PUT(req: NextRequest) {
  const auth = (await requireAdmin()); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const group = String(b.group || "");
  const fields = PROGRAM_FIELDS[group];
  if (!fields) return bad("مجموعة غير صالحة");
  const db = getDb();
  const up = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  const vals: [string, string][] = [[`${group}_enabled`, b.enabled ? "1" : "0"]];
  for (const f of fields) {
    const n = Number(b[f.key]);
    if (!Number.isFinite(n) || n < f.min || n > f.max) return bad("قيمة غير صالحة");
    vals.push([f.key, String(n)]);
  }
  db.transaction(() => { for (const [k, v] of vals) up.run(k, v); })();
  return NextResponse.json({ ok: true });
}
