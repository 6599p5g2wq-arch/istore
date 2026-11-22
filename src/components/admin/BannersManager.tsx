"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Loader2, Save, X, BadgePercent } from "lucide-react";
import DeleteButton from "./DeleteButton";

type BannerT = { id: number; title: string; subtitle: string; image: string; link: string; sort_order: number; active: number };
const EMPTY = { title: "", subtitle: "", image: "", link: "/products", sort_order: 99, active: true };

export default function BannersManager({ banners }: { banners: BannerT[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<BannerT | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const openEdit = (b: BannerT) => { setForm({ title: b.title, subtitle: b.subtitle, image: b.image, link: b.link, sort_order: b.sort_order, active: !!b.active }); setEditing(b); setCreating(false); };
  const close = () => { setCreating(false); setEditing(null); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await fetch(editing ? `/api/admin/banners/${editing.id}` : "/api/admin/banners", {
      method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setLoading(false);
    if (r.ok) { close(); router.refresh(); } else alert("حدث خطأ");
  };

  const inputCls = "w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-black";
  const showForm = creating || editing;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {banners.map((b) => (
          <div key={b.id} className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-neutral-900 text-white"><BadgePercent size={22} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold">{b.title}</p>
              <p className="text-xs text-neutral-400">{b.subtitle} {!b.active && <span className="font-bold text-red-400">(مخفي)</span>}</p>
            </div>
            <button onClick={() => openEdit(b)} aria-label="تعديل" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white"><Pencil size={15} /></button>
            <DeleteButton resource="banners" id={b.id} label={b.title} />
          </div>
        ))}
        <button onClick={() => { setForm(EMPTY); setCreating(true); setEditing(null); }} className="flex items-center gap-2 rounded-full bg-black px-6 py-3 font-bold text-white transition hover:bg-neutral-800">
          <Plus size={18} /> بنر جديد
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-8">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">{editing ? "تعديل البنر" : "بنر جديد"}</h2>
            <button type="button" onClick={close} aria-label="إغلاق"><X size={18} /></button>
          </div>
          <label className="block text-sm font-bold">العنوان *<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`mt-1.5 ${inputCls}`} /></label>
          <label className="block text-sm font-bold">النص الفرعي<input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={`mt-1.5 ${inputCls}`} /></label>
          <label className="block text-sm font-bold">الرابط عند الضغط<input dir="ltr" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className={`mt-1.5 text-left ${inputCls}`} /></label>
          <label className="block text-sm font-bold">الترتيب<input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className={`mt-1.5 ${inputCls}`} /></label>
          <label className="flex cursor-pointer items-center justify-between text-sm font-bold">ظاهر<input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-5 w-5 accent-black" /></label>
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-3 font-bold text-white disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} حفظ
          </button>
        </form>
      )}
    </div>
  );
}
