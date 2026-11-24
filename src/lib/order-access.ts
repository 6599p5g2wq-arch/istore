import crypto from "crypto";
import { cookies } from "next/headers";
const key = process.env.AUTH_ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
export const ORDER_ACCESS_SECONDS = 15 * 60;
const name = (code:string) => "order_access_" + code.replace(/[^A-Za-z0-9]/g, "");
export function orderAccessCookie(code:string) {
  const expiry = Math.floor(Date.now()/1000)+ORDER_ACCESS_SECONDS;
  const payload = `${code}:${expiry}`;
  const token = `${expiry}.${crypto.createHmac("sha256",key).update(payload).digest("hex")}`;
  return {name:name(code),value:token,httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax" as const,path:`/order-success/${code}`,maxAge:ORDER_ACCESS_SECONDS};
}
export async function canViewOrder(code:string) {
  const token=(await cookies()).get(name(code))?.value || "";
  const [expiry,signature]=token.split(".");
  if (!/^\d+$/.test(expiry||"") || Number(expiry)<Date.now()/1000 || !/^[a-f0-9]{64}$/.test(signature||"")) return false;
  const expected=crypto.createHmac("sha256",key).update(`${code}:${expiry}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected));
}
