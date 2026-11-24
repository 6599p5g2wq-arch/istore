import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { clientIp, tooMany, resetLimit } from "@/lib/rate-limit";
import { orderAccessCookie } from "@/lib/order-access";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 const b=await req.json().catch(()=>null);
 if(!b || typeof b.code!=="string" || typeof b.phone!=="string" || b.code.length>40 || b.phone.length>40) return NextResponse.json({error:"بيانات غير صالحة"},{status:400});
 const code=b.code.trim().toUpperCase(),key=`order-verify:${clientIp(req)}`;
 if(tooMany(key,8))return NextResponse.json({error:"محاولات كثيرة، حاول بعد 15 دقيقة"},{status:429});
 const order=getDb().prepare("SELECT phone FROM orders WHERE code=?").get(code) as {phone:string}|undefined;
 const norm=(p:string)=>p.replace(/[^\d+]/g,"").replace(/^\+?218/,"0");
 if(!order || !norm(b.phone) || norm(order.phone)!==norm(b.phone))return NextResponse.json({error:"رقم الهاتف غير مطابق"},{status:403});
 resetLimit(key);const res=NextResponse.json({ok:true});res.cookies.set(orderAccessCookie(code));return res;
}
