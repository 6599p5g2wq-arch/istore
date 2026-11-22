import React from "react";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import ProductCard from "@/components/store/ProductCard";
import ProductsToolbar from "@/components/store/ProductsToolbar";
import type { Category, Product } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "كل المنتجات" };

const SORTS: Record<string, string> = {
  newest: "p.created_at DESC, p.id DESC",
  "price-asc": "p.price ASC",
  "price-desc": "p.price DESC",
  name: "p.name ASC",
};

export default function ProductsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const db = getDb();
  const s = getSettings();
  const cats = db.prepare("SELECT * FROM categories WHERE active = 1 ORDER BY sort_order").all() as Category[];

  const cat = searchParams.category || "";
  const q = (searchParams.q || "").trim();
  const sort = SORTS[searchParams.sort || ""] || SORTS.newest;
  const offers = searchParams.offers === "1";
  const min = Number(searchParams.min || "") || null;
  const max = Number(searchParams.max || "") || null;

  const where: string[] = ["p.active = 1"];
  const params: unknown[] = [];
  if (cat) { where.push("c.slug = ?"); params.push(cat); }
  if (q) { where.push("(p.name LIKE ? OR p.description LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
  if (offers) { where.push("p.old_price IS NOT NULL AND p.old_price > p.price"); }
  if (min !== null) { where.push("p.price >= ?"); params.push(min); }
  if (max !== null) { where.push("p.price <= ?"); params.push(max); }

  const products = db.prepare(
    `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${where.join(" AND ")} ORDER BY ${sort}`
  ).all(...params) as Product[];

  const activeCat = cats.find((c) => c.slug === cat);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">{activeCat ? activeCat.name : offers ? "العروض والتخفيضات" : "كل المنتجات"}</h1>
      {activeCat?.description && <p className="mt-2 text-neutral-500">{activeCat.description}</p>}
      {q && <p className="mt-2 text-neutral-500">نتائج البحث عن «{q}»: {products.length} منتج</p>}

      <ProductsToolbar categories={cats} />

      {products.length === 0 ? (
        <div className="grid place-items-center rounded-3xl bg-white/5 py-24 text-center">
          <p className="text-lg font-bold text-neutral-300">لا توجد منتجات مطابقة</p>
          <p className="mt-1 text-sm text-neutral-500">جرّب تعديل الفلاتر أو البحث بكلمة أخرى</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} currency={s.currency} />)}
        </div>
      )}
      <p className="mt-6 text-sm text-neutral-400">{products.length} منتج</p>
    </div>
  );
}
