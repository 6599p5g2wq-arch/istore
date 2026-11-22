import { NextRequest, NextResponse } from "next/server";
import { getControlSession } from "@/lib/control-auth";
import { setSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  if (!getControlSession()) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (typeof b !== "object" || !b) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  for (const [k, v] of Object.entries(b)) {
    if (typeof v === "string" && k.length <= 60 && v.length <= 5000) setSetting(k, v);
  }
  return NextResponse.json({ ok: true });
}
