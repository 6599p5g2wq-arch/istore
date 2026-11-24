import { NextResponse } from "next/server";
import { clearControlCookie } from "@/lib/control-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  (await clearControlCookie());
  return NextResponse.json({ ok: true });
}
