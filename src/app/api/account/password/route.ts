import { NextRequest, NextResponse } from "next/server";
import { bad } from "@/lib/admin-api";
import { getSessionCustomer, checkCustomerPassword, setCustomerPassword, MIN_PASSWORD } from "@/lib/customer-auth";
import { clientIp, tooMany } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const c = getSessionCustomer();
  if (!c) return bad("سجل دخولك أولاً", 401);
  if (tooMany("pw:" + clientIp(req), 10)) return bad("محاولات كثيرة، حاول بعد قليل", 429);
  const b = await req.json().catch(() => ({}));
  const current = String(b.current || "");
  const next = String(b.next || "");
  if (!checkCustomerPassword(c.id, current)) return bad("كلمة المرور الحالية غير صحيحة");
  if (next.length < MIN_PASSWORD) return bad(`كلمة المرور الجديدة ${MIN_PASSWORD} أحرف على الأقل`);
  setCustomerPassword(c.id, next, 0);
  return NextResponse.json({ ok: true });
}
