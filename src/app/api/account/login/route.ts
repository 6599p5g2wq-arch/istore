import { NextRequest, NextResponse } from "next/server";
import { bad } from "@/lib/admin-api";
import { verifyCustomer, createCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const email = (b.email || "").trim().toLowerCase();
  const password = String(b.password || "");
  const id = verifyCustomer(email, password);
  if (!id) return bad("بيانات الدخول غير صحيحة", 401);
  const token = createCustomerSession(id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("customer_session", token, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return res;
}
