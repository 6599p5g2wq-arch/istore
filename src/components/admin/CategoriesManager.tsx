"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Loader2, Save, X } from "lucide-react";
import ImagePicker from "./ImagePicker";
import DeleteButton from "./DeleteButton";

type Cat = { id: number; name: string; slug: string; description: string; image: string; sort_order: number; active: number; products_count?: number };
const EMPTY = { name: "", slug: "", description: "", image: "", sort_order: 99, active: true };

export default function CategoriesManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Cat | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const openNew = () => { setForm(EMPTY); setCreating(true); setEditing(null); };
  const openEdit = (c: Cat) => { setForm({ name: c.name, slug: c.slug, description: c.description, image: c.image, sort_order: c.sort_order, active: !!c.active }); setEditing(c); setCreating(false); };
  const close = () => { setCreating(false); setEditing(null); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await fetch(editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (r.ok) { close(); router.refresh(); } else {
      const d = await r.json().catch(() => ({}));
      alert(d.error || "حدث خطأ");
    }
  };

  const inputCls = "w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-black";
  const showForm = creating || editing;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt="" className="h-16 w-16 shrink-0 rounded-2xl bg-neutral-100 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{c.name}</p>
                <p className="text-xs text-neutral-400" dir="ltr">/{c.slug} — {c.products_count ?? 0} منتج</p>
                {!c.active && <span className="text-xs font-bold text-red-400">مخفي</span>}
              </div>
              <button onClick={() => openEdit(c)} aria-label="تعديل" className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white"><Pencil size={15} /></button>
              <DeleteButton resource="categories" id={c.id} label={c.name} />
            </div>
          ))}
        </div>
        <button onClick={openNew} className="mt-5 flex items-center gap-2 rounded-full bg-black px-6 py-3 font-bold text-white transition hover:bg-neutral-800">
          <Plus size={18} /> تصنيف جديد
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-8">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">{editing ? `تعديل: ${editing.name}` : "تصنيف جديد"}</h2>
            <button type="button" onClick={close} aria-label="إغلاق"><X size={18} /></button>
          </div>
          <label className="block text-sm font-bold">الاسم *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`mt-1.5 ${inputCls}`} /></label>
          <label className="block text-sm font-bold">slug *<input dir="ltr" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={`mt-1.5 text-left ${inputCls}`} /></label>
          <label className="block text-sm font-bold">الوصف<textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`mt-1.5 resize-none ${inputCls}`} /></label>
          <label className="block text-sm font-bold">الترتيب<input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className={`mt-1.5 ${inputCls}`} /></label>
          <ImagePicker label="صورة التصنيف" value={form.image} onChange={(v) => setForm({ ...form, image: v })} />
          <label className="flex cursor-pointer items-center justify-between text-sm font-bold">ظاهر<input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-5 w-5 accent-black" /></label>
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-3 font-bold text-white disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} حفظ
          </button>
        </form>
      )}
    </div>
  );
}
