import { NextRequest, NextResponse } from "next/server";
import { bad } from "@/lib/admin-api";
import { registerCustomer, createCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const name = (b.name || "").trim().slice(0, 100);
  const email = (b.email || "").trim().toLowerCase();
  const phone = (b.phone || "").trim();
  const password = String(b.password || "");
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("الاسم والبريد الإلكتروني مطلوبان");
  if (password.length < 6) return bad("كلمة المرور 6 أحرف على الأقل");
  const r = registerCustomer(name, email, phone, password);
  if ("error" in r) return bad(r.error);
  const token = createCustomerSession(r.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("customer_session", token, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return res;
}
