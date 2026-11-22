import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, bad } from "@/lib/admin-api";
import { setSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  if (typeof b !== "object" || !b) return bad("بيانات غير صالحة");
  for (const [k, v] of Object.entries(b)) {
    if (typeof v === "string" && k.length <= 60 && v.length <= 5000) setSetting(k, v);
  }
  return NextResponse.json({ ok: true });
}
