"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Check } from "lucide-react";
import DeleteButton from "./DeleteButton";

type City = { id: number; name: string; fee: number; active: number; sort_order: number };

export default function CitiesManager({ cities }: { cities: City[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", fee: "" });
  const [loading, setLoading] = useState(false);
  const [edits, setEdits] = useState<Record<number, { fee: number; active: boolean }>>(
    Object.fromEntries(cities.map((c) => [c.id, { fee: c.fee, active: !!c.active }]))
  );

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await fetch("/api/admin/cities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, fee: Number(form.fee) || 0 }) });
    setLoading(false);
    if (r.ok) { setForm({ name: "", fee: "" }); router.refresh(); } else {
      const d = await r.json().catch(() => ({}));
      alert(d.error || "حدث خطأ");
    }
  };

  const saveRow = async (id: number, name: string, sort: number) => {
    const e = edits[id];
    await fetch(`/api/admin/cities/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, fee: e.fee, active: e.active, sort_order: sort }) });
    router.refresh();
  };

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="overflow-x-auto rounded-3xl bg-white p-4 shadow-sm lg:col-span-2">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b text-right text-xs text-neutral-400">
              <th className="p-3 font-bold">المدينة</th><th className="p-3 font-bold">رسوم التوصيل</th><th className="p-3 font-bold">متاحة</th><th className="p-3 font-bold"></th>
            </tr>
          </thead>
          <tbody>
            {cities.map((c) => (
              <tr key={c.id} className="border-b border-neutral-50 last:border-0">
                <td className="p-3 font-bold">{c.name}</td>
                <td className="p-3">
                  <input type="number" min={0} step="0.5" value={edits[c.id]?.fee ?? c.fee}
                    onChange={(e) => setEdits({ ...edits, [c.id]: { ...edits[c.id], fee: Number(e.target.value) } })}
                    onBlur={() => saveRow(c.id, c.name, c.sort_order)}
                    className="w-24 rounded-lg border border-neutral-200 px-2 py-1.5 outline-none focus:border-black" />
                </td>
                <td className="p-3">
                  <input type="checkbox" checked={edits[c.id]?.active ?? !!c.active}
                    onChange={(e) => { setEdits({ ...edits, [c.id]: { ...edits[c.id], active: e.target.checked } }); fetch(`/api/admin/cities/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: c.name, fee: edits[c.id]?.fee ?? c.fee, active: e.target.checked, sort_order: c.sort_order }) }).then(() => router.refresh()); }}
                    className="h-5 w-5 accent-black" />
                </td>
                <td className="p-3"><DeleteButton resource="cities" id={c.id} label={c.name} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={add} className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-8">
        <h2 className="font-extrabold">إضافة مدينة</h2>
        <label className="block text-sm font-bold">اسم المدينة *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-black" /></label>
        <label className="block text-sm font-bold">رسوم التوصيل<input type="number" min={0} step="0.5" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-black" placeholder="0" /></label>
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-3 font-bold text-white disabled:opacity-60">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} إضافة
        </button>
        <p className="text-xs text-neutral-400">التعديلات على الرسوم تُحفظ تلقائياً عند مغادرة الحقل <Check size={12} className="inline" /></p>
      </form>
    </div>
  );
}
