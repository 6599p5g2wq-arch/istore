"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Loader2, Save, X, BadgePercent, ChevronUp, ChevronDown, Eye, EyeOff, ImageIcon } from "lucide-react";
import DeleteButton from "./DeleteButton";

type BannerT = { id: number; title: string; subtitle: string; image: string; link: string; sort_order: number; active: number };
const EMPTY = { title: "", subtitle: "", image: "", link: "/products", sort_order: 99, active: true };

export default function BannersManager({ banners }: { banners: BannerT[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<BannerT | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const openEdit = (b: BannerT) => { setForm({ title: b.title, subtitle: b.subtitle, image: b.image, link: b.link, sort_order: b.sort_order, active: !!b.active }); setEditing(b); setCreating(false); };
  const close = () => { setCreating(false); setEditing(null); };

  const put = async (b: BannerT, patch: { sort_order?: number; active?: boolean }) => {
    const r = await fetch(`/api/admin/banners/${b.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: b.title, subtitle: b.subtitle, image: b.image, link: b.link, sort_order: b.sort_order, active: !!b.active, ...patch }),
    });
    return r.ok;
  };

  const move = async (b: BannerT, dir: -1 | 1) => {
    const idx = banners.findIndex((x) => x.id === b.id);
    const other = banners[idx + dir];
    if (!other) return;
    setBusyId(b.id);
    const ok1 = await put(b, { sort_order: other.sort_order });
    const ok2 = ok1 && (await put(other, { sort_order: b.sort_order }));
    setBusyId(null);
    if (ok2) router.refresh(); else alert("حدث خطأ");
  };

  const toggleActive = async (b: BannerT) => {
    setBusyId(b.id);
    const ok = await put(b, { active: !b.active });
    setBusyId(null);
    if (ok) router.refresh(); else alert("حدث خطأ");
  };

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
  const iconBtn = "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white disabled:opacity-40";

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {banners.length === 0 && (
          <div className="grid place-items-center rounded-3xl border-2 border-dashed border-neutral-200 bg-white/60 px-6 py-14 text-center">
            <ImageIcon size={36} className="text-neutral-300" />
            <p className="mt-3 font-extrabold text-neutral-500">لا توجد بنرات بعد</p>
            <p className="mt-1 text-sm text-neutral-400">أضف أول بنر ترويجي ليظهر بين أقسام الصفحة الرئيسية</p>
          </div>
        )}
        {banners.map((b, i) => (
          <div key={b.id} className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex flex-col">
              <button onClick={() => move(b, -1)} disabled={i === 0 || busyId === b.id} aria-label="أعلى" className="grid h-6 w-6 place-items-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-black disabled:opacity-30"><ChevronUp size={15} /></button>
              <button onClick={() => move(b, 1)} disabled={i === banners.length - 1 || busyId === b.id} aria-label="أسفل" className="grid h-6 w-6 place-items-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-black disabled:opacity-30"><ChevronDown size={15} /></button>
            </div>
            {b.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={b.image} alt={b.title} className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
            ) : (
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-neutral-900 text-white"><BadgePercent size={22} /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-extrabold">{b.title}</p>
              <p className="text-xs text-neutral-400">{b.subtitle} {!b.active && <span className="font-bold text-red-400">(مخفي)</span>}</p>
            </div>
            <button onClick={() => toggleActive(b)} disabled={busyId === b.id} aria-label={b.active ? "إخفاء" : "إظهار"} title={b.active ? "إخفاء" : "إظهار"} className={iconBtn}>
              {busyId === b.id ? <Loader2 size={15} className="animate-spin" /> : b.active ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            <button onClick={() => openEdit(b)} aria-label="تعديل" className={iconBtn}><Pencil size={15} /></button>
            <DeleteButton resource="banners" id={b.id} label={b.title} />
          </div>
        ))}
        {banners.length > 3 && (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">الواجهة تعرض أول 3 بنرات مفعّلة فقط حسب الترتيب — لديك {banners.length} بنرات.</p>
        )}
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
          <label className="block text-sm font-bold">صورة البنر (اختياري)
            <input dir="ltr" placeholder="/images/banner.jpg أو رابط خارجي" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={`mt-1.5 text-left ${inputCls}`} />
          </label>
          {form.image.trim() ? (
            <div className="overflow-hidden rounded-2xl border border-neutral-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.image} alt="معاينة" className="h-28 w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} onLoad={(e) => { (e.target as HTMLImageElement).style.display = "block"; }} />
            </div>
          ) : (
            <p className="rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-400">بدون صورة تظهر أيقونة افتراضية في البطاقة</p>
          )}
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
