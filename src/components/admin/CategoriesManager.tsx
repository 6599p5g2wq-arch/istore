"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Loader2, Save, X, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import ImagePicker from "./ImagePicker";

type Cat = { id: number; name: string; slug: string; description: string; image: string; sort_order: number; active: number; products_count?: number };
const EMPTY = { name: "", slug: "", description: "", image: "", active: true };

const slugify = (s: string) => s.trim().replace(new RegExp("[^\\p{L}\\p{N}]+","gu"), "-").replace(/^-+|-+$/g, "");

export default function CategoriesManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Cat | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(0);
  const [del, setDel] = useState<Cat | null>(null);
  const [reassign, setReassign] = useState("0");
  const [delLoading, setDelLoading] = useState(false);

  const openNew = () => { setForm(EMPTY); setSlugTouched(false); setCreating(true); setEditing(null); };
  const openEdit = (c: Cat) => { setForm({ name: c.name, slug: c.slug, description: c.description, image: c.image, active: !!c.active }); setSlugTouched(true); setEditing(c); setCreating(false); };
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

  const patch = async (c: Cat, body: Record<string, unknown>) => {
    setBusy(c.id);
    await fetch(`/api/admin/categories/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(0);
    router.refresh();
  };

  const doDelete = async () => {
    if (!del) return;
    setDelLoading(true);
    const r = await fetch(`/api/admin/categories/${del.id}?reassign=${encodeURIComponent(reassign)}`, { method: "DELETE" });
    setDelLoading(false);
    if (r.ok) { setDel(null); router.refresh(); } else {
      const d = await r.json().catch(() => ({}));
      alert(d.error || "حدث خطأ");
    }
  };

  const inputCls = "w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-black";
  const iconBtn = "grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white disabled:opacity-30";
  const showForm = creating || editing;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((c, i) => (
            <div key={c.id} className={`flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm ${c.active ? "" : "opacity-60"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt="" className="h-16 w-16 shrink-0 rounded-2xl bg-neutral-100 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{c.name}</p>
                <Link href={`/admin/products?cat=${c.id}`} className="text-xs font-bold text-violet-700 underline-offset-2 hover:underline">{c.products_count ?? 0} منتج</Link>
                {!c.active && <span className="ms-2 text-xs font-bold text-red-400">مخفي</span>}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <button disabled={busy === c.id || i === 0} onClick={() => patch(c, { move: "up" })} aria-label="رفع" className={`${iconBtn} h-7 w-7`}><ArrowUp size={13} /></button>
                  <button disabled={busy === c.id || i === categories.length - 1} onClick={() => patch(c, { move: "down" })} aria-label="خفض" className={`${iconBtn} h-7 w-7`}><ArrowDown size={13} /></button>
                  <button disabled={busy === c.id} onClick={() => patch(c, { active: !c.active })}
                    aria-label={c.active ? "إخفاء" : "إظهار"}
                    className={`relative h-5 w-9 rounded-full transition ${c.active ? "bg-emerald-500" : "bg-neutral-300"}`}>
                    <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all" style={{ insetInlineStart: c.active ? "calc(100% - 18px)" : "2px" }} />
                  </button>
                </div>
              </div>
              <button onClick={() => openEdit(c)} aria-label="تعديل" className={iconBtn}><Pencil size={15} /></button>
              <button onClick={() => { setDel(c); setReassign("0"); }} aria-label="حذف" className={`${iconBtn} hover:bg-red-600`}><Trash2 size={15} /></button>
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
          <label className="block text-sm font-bold">الاسم *<input required value={form.name} onChange={(e) => { const name = e.target.value; setForm({ ...form, name, slug: slugTouched ? form.slug : slugify(name) }); }} className={`mt-1.5 ${inputCls}`} /></label>
          <label className="block text-sm font-bold">slug *<input dir="ltr" required value={form.slug} onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: e.target.value }); }} className={`mt-1.5 text-left ${inputCls}`} /></label>
          <label className="block text-sm font-bold">الوصف<textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`mt-1.5 resize-none ${inputCls}`} /></label>
          <ImagePicker label="صورة التصنيف" value={form.image} onChange={(v) => setForm({ ...form, image: v })} />
          <label className="flex cursor-pointer items-center justify-between text-sm font-bold">ظاهر<input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-5 w-5 accent-black" /></label>
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-3 font-bold text-white disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} حفظ
          </button>
        </form>
      )}

      {del && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => !delLoading && setDel(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-extrabold">حذف «{del.name}»</h2>
            {(del.products_count ?? 0) > 0 ? (
              <>
                <p className="mt-3 text-sm text-neutral-600">هذا التصنيف مرتبط بـ <b>{del.products_count}</b> منتج. ماذا نفعل بها؟</p>
                <select value={reassign} onChange={(e) => setReassign(e.target.value)} className={`mt-3 ${inputCls}`}>
                  <option value="0">بدون تصنيف</option>
                  {categories.filter((c) => c.id !== del.id).map((c) => <option key={c.id} value={c.id}>نقل إلى: {c.name}</option>)}
                </select>
              </>
            ) : (
              <p className="mt-3 text-sm text-neutral-600">لا توجد منتجات مرتبطة بهذا التصنيف.</p>
            )}
            <div className="mt-5 flex gap-2">
              <button onClick={doDelete} disabled={delLoading} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 py-3 font-bold text-white disabled:opacity-60">
                {delLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} حذف التصنيف
              </button>
              <button onClick={() => setDel(null)} disabled={delLoading} className="rounded-full bg-neutral-100 px-6 py-3 font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
