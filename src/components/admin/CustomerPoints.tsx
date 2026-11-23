"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CustomerPoints({ id, vip }: { id: number; vip: "auto" | "on" | "off" }) {
  const router = useRouter();
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const inputCls = "w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-black";

  const post = async (body: object) => {
    setLoading(true);
    const r = await fetch(`/api/admin/customers/${id}/points`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setLoading(false);
    if (r.ok) { setDelta(""); setReason(""); router.refresh(); }
    else { const d = await r.json().catch(() => ({})); alert(d.error || "حدث خطأ"); }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); post({ delta: Number(delta), reason }); }} className="flex flex-wrap items-end gap-2">
        <label className="w-32 text-xs font-bold">± نقاط<input required type="number" value={delta} onChange={(e) => setDelta(e.target.value)} className={`${inputCls} mt-1`} placeholder="مثال: 50 أو -20" /></label>
        <label className="min-w-[160px] flex-1 text-xs font-bold">السبب<input value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} mt-1`} placeholder="تعويض، هدية..." /></label>
        <button disabled={loading} className="flex items-center gap-1.5 rounded-full bg-black px-5 py-2 text-sm font-bold text-white disabled:opacity-60">{loading && <Loader2 size={14} className="animate-spin" />} تطبيق</button>
      </form>
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className="text-neutral-500">وسم VIP:</span>
        {([["auto", "تلقائي"], ["on", "مفعّل يدوياً"], ["off", "معطّل"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => post({ vip: k })} className={`rounded-full px-3 py-1.5 ${vip === k ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500"}`}>{l}</button>
        ))}
      </div>
    </div>
  );
}
