"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Loader2, Save, X } from "lucide-react";
import ImagePicker from "./ImagePicker";
import DeleteButton from "./DeleteButton";

type Slide = { id: number; title: string; subtitle: string; cta_text: string; cta_link: string; image: string; theme: string; sort_order: number; active: number };
const EMPTY = { title: "", subtitle: "", cta_text: "تسوق الآن", cta_link: "/products", image: "", theme: "dark", sort_order: 99, active: true };

export default function HeroManager({ slides }: { slides: Slide[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Slide | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const openEdit = (s: Slide) => { setForm({ title: s.title, subtitle: s.subtitle, cta_text: s.cta_text, cta_link: s.cta_link, image: s.image, theme: s.theme, sort_order: s.sort_order, active: !!s.active }); setEditing(s); setCreating(false); };
  const close = () => { setCreating(false); setEditing(null); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await fetch(editing ? `/api/admin/hero/${editing.id}` : "/api/admin/hero", {
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
        {slides.map((s) => (
          <div key={s.id} className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} alt="" className="h-20 w-28 shrink-0 rounded-2xl bg-neutral-100 object-cover" />
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-line font-extrabold leading-snug">{s.title}</p>
              <p className="line-clamp-1 text-xs text-neutral-400">{s.subtitle}</p>
              <p className="text-xs text-neutral-400" dir="ltr">{s.cta_text} → {s.cta_link} {!s.active && <span className="font-bold text-red-400">(مخفي)</span>}</p>
            </div>
            <button onClick={() => openEdit(s)} aria-label="تعديل" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white"><Pencil size={15} /></button>
            <DeleteButton resource="hero" id={s.id} label={s.title.split("\n")[0]} />
          </div>
        ))}
        <button onClick={() => { setForm(EMPTY); setCreating(true); setEditing(null); }} className="flex items-center gap-2 rounded-full bg-black px-6 py-3 font-bold text-white transition hover:bg-neutral-800">
          <Plus size={18} /> شريحة جديدة
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-8">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">{editing ? "تعديل الشريحة" : "شريحة جديدة"}</h2>
            <button type="button" onClick={close} aria-label="إغلاق"><X size={18} /></button>
          </div>
          <label className="block text-sm font-bold">العنوان *<textarea required rows={2} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`mt-1.5 resize-none ${inputCls}`} /></label>
          <label className="block text-sm font-bold">النص الفرعي<textarea rows={2} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={`mt-1.5 resize-none ${inputCls}`} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-bold">نص الزر<input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} className={`mt-1.5 ${inputCls}`} /></label>
            <label className="block text-sm font-bold">رابط الزر<input dir="ltr" value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} className={`mt-1.5 text-left ${inputCls}`} /></label>
          </div>
          <label className="block text-sm font-bold">الترتيب<input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className={`mt-1.5 ${inputCls}`} /></label>
          <ImagePicker label="صورة الشريحة" value={form.image} onChange={(v) => setForm({ ...form, image: v })} />
          <label className="flex cursor-pointer items-center justify-between text-sm font-bold">ظاهرة<input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-5 w-5 accent-black" /></label>
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-3 font-bold text-white disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} حفظ
          </button>
        </form>
      )}
    </div>
  );
}
