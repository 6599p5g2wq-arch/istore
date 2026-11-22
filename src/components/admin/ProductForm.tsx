"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import ImagePicker from "./ImagePicker";
import type { Brand, Category, Product, ProductOption, ProductVariant } from "@/lib/types";

type OptRow = { name: string; valuesText: string };
type VRow = { price: string; stock: string; image: string };

function parseOpts(json: string | undefined): OptRow[] {
  try {
    const a = JSON.parse(json || "[]");
    if (!Array.isArray(a)) return [];
    return a
      .filter((o) => o && o.name && Array.isArray(o.values) && o.values.length)
      .map((o) => ({ name: String(o.name), valuesText: o.values.join("، ") }));
  } catch {
    return [];
  }
}

function combosFromRows(rows: OptRow[]): { options: ProductOption[]; combos: { label: string; combo: Record<string, string> }[] } {
  const options: ProductOption[] = rows
    .map((r) => ({ name: r.name.trim(), values: r.valuesText.split(/[,،\n]/).map((v) => v.trim()).filter(Boolean) }))
    .filter((o) => o.name && o.values.length > 0)
    .slice(0, 3);
  let acc: Record<string, string>[] = [{}];
  for (const o of options) {
    const next: Record<string, string>[] = [];
    for (const base of acc) for (const v of o.values) next.push({ ...base, [o.name]: v });
    acc = next;
  }
  return {
    options,
    combos: options.length ? acc.map((combo) => ({ label: options.map((o) => combo[o.name]).join(" / "), combo })) : [],
  };
}

export default function ProductForm({ product, categories, brands, variants }: { product?: Product; categories: Category[]; brands: Brand[]; variants?: ProductVariant[] }) {
  const router = useRouter();
  const isEdit = !!product;
  const [form, setForm] = useState<{
    name: string; slug: string; category_id: number | ""; brand_id: number | ""; description: string;
    price: number | ""; old_price: number | ""; stock: number; image: string;
    badge: string; rating: number; featured: boolean; active: boolean;
  }>({
    name: product?.name || "",
    slug: product?.slug || "",
    category_id: product?.category_id || (categories[0]?.id ?? ""),
    brand_id: product?.brand_id ?? "",
    description: product?.description || "",
    price: product?.price ?? "",
    old_price: product?.old_price ?? "",
    stock: product?.stock ?? 10,
    image: product?.image || "",
    badge: product?.badge || "",
    rating: product?.rating ?? 4.8,
    featured: !!product?.featured,
    active: product ? !!product.active : true,
  });
  const [opts, setOpts] = useState<OptRow[]>(() => parseOpts(product?.options));
  const [vrows, setVrows] = useState<Record<string, VRow>>(() => {
    const m: Record<string, VRow> = {};
    for (const v of variants || []) m[v.label] = { price: v.price != null ? String(v.price) : "", stock: String(v.stock), image: v.image || "" };
    return m;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { options, combos } = useMemo(() => combosFromRows(opts), [opts]);
  const hasVariants = combos.length > 0;

  const vrow = (label: string): VRow => vrows[label] || { price: "", stock: String(form.stock || 0), image: "" };
  const setVrow = (label: string, patch: Partial<VRow>) => setVrows((prev) => ({ ...prev, [label]: { ...vrow(label), ...prev[label], ...patch } }));

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const payload = {
      ...form,
      category_id: form.category_id === "" ? null : Number(form.category_id),
      brand_id: form.brand_id === "" ? null : Number(form.brand_id),
      price: Number(form.price) || 0,
      old_price: form.old_price === "" ? null : Number(form.old_price),
      stock: Number(form.stock) || 0,
      rating: Number(form.rating) || 4.8,
      images: [],
      options,
      variants: combos.map(({ label, combo }) => {
        const r = vrow(label);
        return { options: combo, price: r.price === "" ? null : Number(r.price), stock: Number(r.stock) || 0, image: r.image.trim() };
      }),
    };
    const r = await fetch(isEdit ? `/api/admin/products/${product.id}` : "/api/admin/products", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json().catch(() => ({}));
    setLoading(false);
    if (r.ok) { router.push("/admin/products"); router.refresh(); }
    else setError(d.error || "حدث خطأ");
  };

  const inputCls = "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-black focus:ring-4 focus:ring-black/5";

  return (
    <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-3">
      <div className="space-y-5 rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
        <label className="block text-sm font-bold">
          اسم المنتج *
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`mt-1.5 ${inputCls}`} placeholder="مثال: غطاء iPhone 16 سيليكون أصلي" />
        </label>
        <label className="block text-sm font-bold">
          الرابط (slug) *
          <input dir="ltr" required value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className={`mt-1.5 text-left ${inputCls}`} placeholder="iphone-16-silicone-case" />
        </label>
        <label className="block text-sm font-bold">
          الوصف
          <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`mt-1.5 resize-y ${inputCls}`} placeholder="وصف تفصيلي يظهر في صفحة المنتج…" />
        </label>
        <ImagePicker label="الصورة الرئيسية" value={form.image} onChange={(v) => setForm({ ...form, image: v })} />

        <div className="rounded-2xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">خيارات المنتج (متغيرات)</p>
              <p className="mt-1 text-xs text-neutral-500">مثال: الخيار «الجهاز» بقيم «16 Pro Max، 16 Pro، 16» أو «اللون» بقيم «أسود، أبيض». يمكن الجمع بين خيارين أو ثلاثة، ولكل توليفة مخزونها وسعرها وصورتها الاختيارية.</p>
            </div>
            {opts.length < 3 && (
              <button type="button" onClick={() => setOpts([...opts, { name: "", valuesText: "" }])} className="flex shrink-0 items-center gap-1 rounded-full bg-black px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800">
                <Plus size={14} /> أضف خياراً
              </button>
            )}
          </div>
          {opts.map((o, i) => (
            <div key={i} className="mt-3 flex flex-wrap items-start gap-2 rounded-xl bg-neutral-50 p-3">
              <input value={o.name} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="اسم الخيار (مثال: الجهاز)" className="w-40 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-black" />
              <input value={o.valuesText} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? { ...x, valuesText: e.target.value } : x)))} placeholder="القيم مفصولة بفاصلة: 16 Pro Max، 16 Pro، 16" className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-black" />
              <button type="button" onClick={() => setOpts(opts.filter((_, j) => j !== i))} aria-label="حذف الخيار" className="grid h-9 w-9 place-items-center rounded-full text-neutral-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
          ))}
          {hasVariants && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-right text-xs text-neutral-500">
                    <th className="py-2 font-bold">التوليفة</th>
                    <th className="py-2 font-bold">المخزون</th>
                    <th className="py-2 font-bold">سعر خاص (اختياري)</th>
                    <th className="py-2 font-bold">صورة (اختياري)</th>
                  </tr>
                </thead>
                <tbody>
                  {combos.map(({ label }) => {
                    const r = vrow(label);
                    return (
                      <tr key={label} className="border-b border-neutral-100 last:border-0">
                        <td className="py-2 pl-2 font-bold">{label}</td>
                        <td className="py-2 pl-2"><input type="number" min={0} value={r.stock} onChange={(e) => setVrow(label, { stock: e.target.value })} className="w-20 rounded-lg border border-neutral-200 px-2 py-1.5 outline-none focus:border-black" /></td>
                        <td className="py-2 pl-2"><input type="number" min={0} step="0.5" value={r.price} onChange={(e) => setVrow(label, { price: e.target.value })} placeholder={String(form.price || "")} className="w-24 rounded-lg border border-neutral-200 px-2 py-1.5 outline-none focus:border-black placeholder:text-neutral-300" /></td>
                        <td className="py-2"><input dir="ltr" value={r.image} onChange={(e) => setVrow(label, { image: e.target.value })} placeholder="images/...jpg" className="w-full min-w-[140px] rounded-lg border border-neutral-200 px-2 py-1.5 text-left text-xs outline-none focus:border-black placeholder:text-neutral-300" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-neutral-500">اترك «سعر خاص» فارغاً لاستخدام سعر المنتج الأساسي. مخزون المنتج الكلي يُحسب تلقائياً من مجموع مخزون التوليفات.</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
          <label className="block text-sm font-bold">
            التصنيف
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value === "" ? "" : Number(e.target.value) })} className={`mt-1.5 ${inputCls}`}>
              <option value="">بدون تصنيف</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold">
            الماركة
            <select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value === "" ? "" : Number(e.target.value) })} className={`mt-1.5 ${inputCls}`}>
              <option value="">بدون ماركة</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-bold">
              السعر *
              <input required type="number" min={0} step="0.5" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value === "" ? "" : Number(e.target.value) })} className={`mt-1.5 ${inputCls}`} />
            </label>
            <label className="block text-sm font-bold">
              السعر قبل الخصم
              <input type="number" min={0} step="0.5" value={form.old_price} onChange={(e) => setForm({ ...form, old_price: e.target.value === "" ? "" : Number(e.target.value) })} className={`mt-1.5 ${inputCls}`} placeholder="اختياري" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-bold">
              المخزون
              <input type="number" min={0} value={form.stock} disabled={hasVariants} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className={`mt-1.5 ${inputCls} disabled:bg-neutral-100 disabled:text-neutral-400`} />
              {hasVariants && <span className="mt-1 block text-[11px] font-normal text-neutral-400">يُحسب من المتغيرات</span>}
            </label>
            <label className="block text-sm font-bold">
              التقييم (0-5)
              <input type="number" min={0} max={5} step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className={`mt-1.5 ${inputCls}`} />
            </label>
          </div>
          <label className="block text-sm font-bold">
            شارة مميزة
            <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className={`mt-1.5 ${inputCls}`}>
              <option value="">بدون شارة</option>
              <option value="جديد">جديد</option>
              <option value="الأكثر مبيعاً">الأكثر مبيعاً</option>
              <option value="خصم">خصم</option>
              <option value="حصري">حصري</option>
            </select>
          </label>
        </div>
        <div className="space-y-3 rounded-3xl bg-white p-6 shadow-sm">
          <label className="flex cursor-pointer items-center justify-between text-sm font-bold">
            منتج مميز (يظهر بالرئيسية)
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-5 w-5 accent-black" />
          </label>
          <label className="flex cursor-pointer items-center justify-between text-sm font-bold">
            ظاهر في المتجر
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-5 w-5 accent-black" />
          </label>
        </div>
        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-4 font-bold text-white shadow-lg transition hover:bg-neutral-800 disabled:opacity-60">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {isEdit ? "حفظ التعديلات" : "إضافة المنتج"}
        </button>
      </div>
    </form>
  );
}
