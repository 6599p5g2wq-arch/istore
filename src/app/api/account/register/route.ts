import { NextRequest, NextResponse } from "next/server";
import { bad } from "@/lib/admin-api";
import { registerCustomer, createCustomerSession, MIN_PASSWORD } from "@/lib/customer-auth";
import { normalizeLibyanPhone } from "@/lib/phone";
import { clientIp, tooMany } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (tooMany("reg:" + clientIp(req), 10)) return bad("محاولات كثيرة، حاول بعد قليل", 429);
  const b = await req.json().catch(() => ({}));
  const name = (b.name || "").trim().slice(0, 100);
  const email = (b.email || "").trim().toLowerCase();
  const phone = normalizeLibyanPhone(b.phone || "");
  const password = String(b.password || "");
  if (!name) return bad("الاسم مطلوب");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("البريد الإلكتروني غير صحيح");
  if (!phone) return bad("رقم الهاتف غير صحيح (مثال: 0912345678)");
  if (password.length < MIN_PASSWORD) return bad(`كلمة المرور ${MIN_PASSWORD} أحرف على الأقل`);
  const r = registerCustomer(name, email, phone, password);
  if ("error" in r) return bad(r.error);
  const token = createCustomerSession(r.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("customer_session", token, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return res;
}
