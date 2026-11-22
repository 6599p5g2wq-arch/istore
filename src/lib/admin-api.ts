import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";

export function requireAdmin(): NextResponse | null {
  const admin = getSessionAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  return null;
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
