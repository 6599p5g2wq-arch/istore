"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import ImagePicker from "./ImagePicker";
import type { Brand, Category, Product } from "@/lib/types";

export default function ProductForm({ product, categories, brands }: { product?: Product; categories: Category[]; brands: Brand[] }) {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
              <input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className={`mt-1.5 ${inputCls}`} />
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
