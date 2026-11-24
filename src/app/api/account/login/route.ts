import { NextRequest, NextResponse } from "next/server";
import { bad } from "@/lib/admin-api";
import { verifyCustomer, createCustomerSession } from "@/lib/customer-auth";
import { clientIp, tooMany, resetLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (!b || typeof b !== "object" || ["identifier","email","password"].some(k=>b[k]!==undefined && typeof b[k]!=="string")) return bad("بيانات غير صالحة");
  if (String(b.identifier||b.email||"").length>254 || String(b.password||"").length>1024) return bad("بيانات غير صالحة");
  if (tooMany(`login-ip:${clientIp(req)}`,40)) return bad("محاولات كثيرة، حاول لاحقا",429);
  const identifier = String(b.identifier || b.email || "").trim();
  const password = String(b.password || "");
  const key = `login-account:${identifier.toLowerCase()}`;
  if (tooMany(key, 8)) return bad("محاولات دخول كثيرة، حاول بعد 15 دقيقة", 429);
  const r = verifyCustomer(identifier, password);
  if ("error" in r) return bad(r.error, 401);
  resetLimit(key);
  const token = createCustomerSession(r.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("customer_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return res;
}
