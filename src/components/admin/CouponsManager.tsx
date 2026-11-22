"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, TicketPercent } from "lucide-react";
import DeleteButton from "./DeleteButton";
import { formatPrice } from "@/lib/format";
import type { Coupon } from "@/lib/types";

export default function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ code: "", kind: "percent", value: "", min_total: "", expires_at: "" });
  const [loading, setLoading] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, value: Number(form.value) || 0, min_total: Number(form.min_total) || 0 }),
    });
    setLoading(false);
    if (r.ok) { setForm({ code: "", kind: "percent", value: "", min_total: "", expires_at: "" }); router.refresh(); }
    else { const d = await r.json().catch(() => ({})); alert(d.error || "حدث خطأ"); }
  };

  const toggle = async (c: Coupon) => {
    await fetch(`/api/admin/coupons/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !c.active }) });
    router.refresh();
  };

  const inputCls = "mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-black";

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {coupons.length === 0 && <p className="rounded-3xl bg-white p-10 text-center text-sm text-neutral-400 shadow-sm">لا توجد أكواد خصم بعد</p>}
        {coupons.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-black text-white"><TicketPercent size={19} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold" dir="ltr">{c.code}</p>
              <p className="text-xs text-neutral-500">
                {c.kind === "percent" ? `خصم ${c.value}%` : `خصم ${formatPrice(c.value)}`}
                {c.min_total > 0 && ` — حد أدنى ${formatPrice(c.min_total)}`}
                {c.expires_at && ` — حتى ${c.expires_at}`}
              </p>
            </div>
            <button onClick={() => toggle(c)} className={`rounded-full px-4 py-1.5 text-xs font-bold ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
              {c.active ? "فعال" : "معطل"}
            </button>
            <DeleteButton resource="coupons" id={c.id} label={c.code} />
          </div>
        ))}
      </div>
      <form onSubmit={add} className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-8">
        <h2 className="font-extrabold">إنشاء كود خصم</h2>
        <label className="block text-sm font-bold">الكود *<input required dir="ltr" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={`${inputCls} text-left`} placeholder="ISTORE10" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-bold">النوع
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className={inputCls}>
              <option value="percent">نسبة %</option>
              <option value="fixed">مبلغ ثابت</option>
            </select>
          </label>
          <label className="block text-sm font-bold">القيمة *<input required type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={inputCls} /></label>
        </div>
        <label className="block text-sm font-bold">حد أدنى للطلب (اختياري)<input type="number" min={0} value={form.min_total} onChange={(e) => setForm({ ...form, min_total: e.target.value })} className={inputCls} placeholder="0" /></label>
        <label className="block text-sm font-bold">تاريخ الانتهاء (اختياري)<input type="date" dir="ltr" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className={`${inputCls} text-left`} /></label>
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-3 font-bold text-white disabled:opacity-60">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} إنشاء
        </button>
      </form>
    </div>
  );
}
