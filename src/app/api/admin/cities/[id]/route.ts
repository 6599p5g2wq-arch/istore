import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";
export const dynamic = "force-dynamic";
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const db = getDb(); const id = Number(params.id);
  try {
    db.transaction(() => {
      const current = db.prepare("SELECT * FROM cities WHERE id=?").get(id) as {active:number} | undefined;
      if (!current) throw new Error("المدينة غير موجودة");
      if (b.action === "move") {
        const ids = (db.prepare("SELECT id FROM cities ORDER BY sort_order, name, id").all() as {id:number}[]).map(c => c.id);
        const i=ids.indexOf(id), j=i+(b.direction === "up" ? -1 : 1);
        if (j>=0 && j<ids.length) { [ids[i],ids[j]]=[ids[j],ids[i]]; ids.forEach((v,n)=>db.prepare("UPDATE cities SET sort_order=? WHERE id=?").run(n+1,v)); }
        return;
      }
      if (typeof b.name !== "string" || !b.name.trim()) throw new Error("اسم المدينة مطلوب");
      if (db.prepare("SELECT id FROM cities WHERE name=? AND id<>?").get(b.name.trim(),id)) throw new Error("هذه المدينة مضافة مسبقاً");
      const fee=Number(b.fee); if (!Number.isFinite(fee) || fee<0) throw new Error("رسوم التوصيل يجب أن تكون رقماً غير سالب");
      if (current.active && !b.active && (db.prepare("SELECT COUNT(*) n FROM cities WHERE active=1").get() as {n:number}).n<=1) throw new Error("لا يمكن تعطيل آخر مدينة متاحة. أضف أو فعّل مدينة أخرى أولاً");
      db.prepare("UPDATE cities SET name=?,fee=?,active=?,sort_order=? WHERE id=?").run(b.name.trim(),fee,b.active?1:0,Number.isFinite(Number(b.sort_order))?Number(b.sort_order):99,id);
    })();
    return NextResponse.json({ok:true});
  } catch(e) {return bad(e instanceof Error ? e.message : "تعذر الحفظ");}
}
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth=requireAdmin(); if(auth)return auth; const db=getDb();
  try {db.transaction(()=>{
    const c=db.prepare("SELECT active FROM cities WHERE id=?").get(params.id) as {active:number}|undefined;
    if(c?.active && (db.prepare("SELECT COUNT(*) n FROM cities WHERE active=1").get() as {n:number}).n<=1) throw new Error("لا يمكن حذف آخر مدينة متاحة. أضف أو فعّل مدينة أخرى أولاً");
    db.prepare("DELETE FROM cities WHERE id=?").run(params.id);
  })(); return NextResponse.json({ok:true});} catch(e){return bad(e instanceof Error?e.message:"تعذر الحذف");}
}
