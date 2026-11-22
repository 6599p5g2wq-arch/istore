import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroyCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const token = cookies().get("customer_session")?.value;
  if (token) destroyCustomerSession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("customer_session", "", { maxAge: 0, path: "/" });
  return res;
}
