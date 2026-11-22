import React from "react";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { Plus, Pencil, Star } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";
import ProductsSearch from "@/components/admin/ProductsSearch";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function AdminProducts({ searchParams }: { searchParams: { q?: string } }) {
  const db = getDb();
  const s = getSettings();
  const q = (searchParams.q || "").trim();
  const products = q
    ? db.prepare("SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.name LIKE ? ORDER BY p.id DESC").all(`%${q}%`) as Product[]
    : db.prepare("SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.id DESC").all() as Product[];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">المنتجات</h1>
          <p className="mt-1 text-sm text-neutral-500"><span id="products-count">{products.length}</span> منتج</p>
        </div>
        <Link href="/admin/products/new" className="flex items-center gap-2 rounded-full bg-black px-6 py-3 font-bold text-white transition hover:bg-neutral-800">
          <Plus size={18} /> منتج جديد
        </Link>
      </div>

      <form className="mt-6">
        <ProductsSearch initialQ={q} />
      </form>

      <div className="mt-6 overflow-x-auto rounded-3xl bg-white p-4 shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b text-right text-xs text-neutral-400">
              <th className="p-3 font-bold">المنتج</th><th className="p-3 font-bold">التصنيف</th><th className="p-3 font-bold">السعر</th>
              <th className="p-3 font-bold">المخزون</th><th className="p-3 font-bold">مميز</th><th className="p-3 font-bold">ظاهر</th><th className="p-3 font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr id="products-empty" style={{ display: "none" }}><td colSpan={7} className="p-6 text-center text-sm font-bold text-neutral-400">لا توجد منتجات مطابقة</td></tr>
            {products.map((p) => (
              <tr key={p.id} data-name={p.name.toLowerCase()} className="js-product-row border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" className="h-12 w-12 rounded-xl bg-neutral-100 object-cover" />
                    <div>
                      <p className="line-clamp-1 font-bold">{p.name}</p>
                      <p className="flex items-center gap-1 text-xs text-neutral-400"><Star size={11} className="text-amber-400" fill="currentColor" /> {p.rating.toFixed(1)} {p.badge && <span className="mr-1 rounded bg-neutral-100 px-1.5 py-0.5">{p.badge}</span>}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-neutral-500">{p.category_name || "—"}</td>
                <td className="p-3">
                  <span className="font-bold">{formatPrice(p.price, s.currency)}</span>
                  {p.old_price && <span className="block text-xs text-neutral-400 line-through">{formatPrice(p.old_price, s.currency)}</span>}
                </td>
                <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${p.stock === 0 ? "bg-red-100 text-red-600" : p.stock <= 5 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{p.stock}</span></td>
                <td className="p-3">{p.featured ? "⭐" : "—"}</td>
                <td className="p-3">{p.active ? <span className="text-emerald-500 font-bold">نعم</span> : <span className="text-neutral-400">مخفي</span>}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/products/${p.id}`} className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white" aria-label="تعديل"><Pencil size={15} /></Link>
                    <DeleteButton resource="products" id={p.id} label={p.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
