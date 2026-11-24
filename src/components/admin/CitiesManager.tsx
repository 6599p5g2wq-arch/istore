"use client";
import React, {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Plus,Loader2,ChevronUp,ChevronDown,Trash2,MapPin} from "lucide-react";
type City={id:number;name:string;fee:number;active:number;sort_order:number};
export default function CitiesManager({cities,threshold,currency}:{cities:City[];threshold:string;currency:string}) {
 const router=useRouter(); const [rows,setRows]=useState(cities); const [form,setForm]=useState({name:"",fee:""});
 const [limit,setLimit]=useState(threshold); const [busy,setBusy]=useState(false); const [notice,setNotice]=useState(""); const [error,setError]=useState("");
 useEffect(()=>setRows(cities),[cities]);
 const request=async(url:string,method:string,body?:unknown)=>{setBusy(true);setError("");setNotice("");try{const r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||"تعذر الحفظ");setNotice("تم الحفظ بنجاح");router.refresh();return true;}catch(e){setError(e instanceof Error?e.message:"تعذر الاتصال. لم يتم تأكيد الحفظ");return false;}finally{setBusy(false);}};
 const change=(id:number,patch:Partial<City>)=>setRows(prev=>prev.map(c=>c.id===id?{...c,...patch}:c));
 const save=(c:City)=>request(`/api/admin/cities/${c.id}`,"PUT",{...c,active:!!c.active});
 const input="w-full min-w-0 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-black";
 return <div className="mt-6 space-y-5">
 <form onSubmit={e=>{e.preventDefault();request('/api/admin/settings','PUT',{free_shipping_threshold:limit});}} className="flex flex-wrap items-end gap-3 rounded-3xl bg-white p-5">
 <label className="text-sm font-bold">الشحن المجاني للطلبات من ({currency})<input aria-label="حد الشحن المجاني" type="number" min="0" step="0.01" required value={limit} onChange={e=>setLimit(e.target.value)} className={`${input} mt-2 max-w-52 block`}/></label>
 <button disabled={busy} className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white disabled:opacity-40">حفظ الحد</button><p className="text-xs text-neutral-500">0 لتعطيل الشحن المجاني</p></form>
 {error&&<p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
 {notice&&<p role="status" className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</p>}
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><div className="min-w-0 space-y-3 lg:col-span-2">
 {!rows.length&&<div className="rounded-3xl border-2 border-dashed bg-white p-10 text-center"><MapPin className="mx-auto text-neutral-400"/><p className="mt-3 font-bold">لا توجد مدن بعد</p><p className="mt-2 text-sm text-neutral-500">أضف مدينة متاحة لتمكين إتمام الطلبات</p></div>}
 {rows.map((c,i)=><div key={c.id} className="rounded-3xl bg-white p-4 shadow-sm"><div className="flex items-center gap-2">
 <div className="flex shrink-0 flex-col">{([-1,1] as const).map(dir=><button key={dir} disabled={busy||(dir===-1?i===0:i===rows.length-1)} aria-label={dir===-1?'أعلى':'أسفل'} onClick={()=>request(`/api/admin/cities/${c.id}`,'PUT',{action:'move',direction:dir===-1?'up':'down'})} className="rounded-lg p-1 hover:bg-neutral-100 disabled:opacity-25">{dir===-1?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</button>)}</div>
 <input aria-label="اسم المدينة" value={c.name} disabled={busy} onChange={e=>change(c.id,{name:e.target.value})} onBlur={()=>{const old=cities.find(x=>x.id===c.id);if(old?.name!==c.name)save(c);}} className={`${input} font-bold`}/>
 <button disabled={busy} aria-label="حذف" onClick={()=>{if(confirm(`حذف مدينة ${c.name}؟`))request(`/api/admin/cities/${c.id}`,'DELETE');}} className="shrink-0 rounded-full bg-red-50 p-2 text-red-500 disabled:opacity-40"><Trash2 size={16}/></button></div>
 <div className="mt-3 flex flex-wrap items-center gap-3 pr-8"><label className="text-xs font-bold">الرسوم ({currency})<input aria-label="رسوم التوصيل" type="number" min="0" step="0.01" disabled={busy} value={c.fee} onChange={e=>change(c.id,{fee:Number(e.target.value)})} onBlur={()=>{if(cities.find(x=>x.id===c.id)?.fee!==c.fee)save(c);}} className={`${input} mt-1 !w-28 block`}/></label>
 {c.fee===0&&<span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">مجاني</span>}
 <label className="mr-auto flex items-center gap-2 text-xs font-bold"><input type="checkbox" disabled={busy} checked={!!c.active} onChange={e=>save({...c,active:e.target.checked?1:0})} className="h-5 w-5 accent-black"/>{c.active?'متاحة':'غير متاحة'}</label></div></div>)}
 <p className="text-xs text-neutral-500">يُحفظ الاسم والرسوم عند مغادرة الحقل. لا يمكن حذف أو تعطيل آخر مدينة متاحة.</p></div>
 <form onSubmit={async e=>{e.preventDefault();if(await request('/api/admin/cities','POST',{name:form.name,fee:Number(form.fee)}))setForm({name:'',fee:''});}} className="h-fit space-y-4 rounded-3xl bg-white p-6 lg:sticky lg:top-8"><h2 className="font-extrabold">إضافة مدينة</h2><label className="block text-sm font-bold">اسم المدينة *<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={`${input} mt-2`}/></label><label className="block text-sm font-bold">رسوم التوصيل<input type="number" min="0" step="0.01" value={form.fee} onChange={e=>setForm({...form,fee:e.target.value})} className={`${input} mt-2`} placeholder="0"/></label><button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-3 font-bold text-white disabled:opacity-40">{busy?<Loader2 size={16} className="animate-spin"/>:<Plus size={16}/>} إضافة</button></form></div></div>;
}
