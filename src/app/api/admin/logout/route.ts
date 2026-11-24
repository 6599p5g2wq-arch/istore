import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const token = (await cookies()).get("admin_session")?.value;
  if (token) destroySession(token);
  (await cookies()).delete("admin_session");
  return NextResponse.json({ ok: true });
}
