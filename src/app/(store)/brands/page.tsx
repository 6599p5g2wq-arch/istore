import React from "react";
import Link from "next/link";
import { Tag } from "lucide-react";
import { getDb } from "@/lib/db";
import Reveal from "@/components/store/Reveal";
import type { Brand } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "الماركات" };

export default function BrandsPage() {
  const db = getDb();
  const brands = db.prepare(
    `SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.active = 1) AS products_count
     FROM brands b WHERE b.active = 1 ORDER BY b.sort_order`
  ).all() as (Brand & { products_count: number })[];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">الماركات</h1>
      <p className="mt-2 text-neutral-500">تسوّق حسب ماركتك المفضلة — كلها منتجات أصلية ومضمونة</p>

      {brands.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-3xl bg-white/5 py-24 text-center">
          <p className="text-lg font-bold text-neutral-300">لا توجد ماركات بعد</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {brands.map((b, i) => (
            <Reveal key={b.slug} delay={i * 0.06}>
            <Link
              href={`/products?brand=${b.slug}`}
              className="group flex flex-col items-center gap-4 rounded-3xl bg-white/5 p-8 text-center transition hover:bg-white/10"
            >
              {b.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.image} alt={b.name} className="h-20 w-20 rounded-3xl bg-white/10 object-cover transition group-hover:scale-105" />
              ) : (
                <span className="grid h-20 w-20 place-items-center rounded-3xl bg-white/10 text-neutral-300 transition group-hover:scale-105"><Tag size={30} /></span>
              )}
              <span>
                <span className="block text-lg font-extrabold text-white">{b.name}</span>
                <span className="mt-1 block text-sm text-neutral-500">{b.products_count} منتج</span>
              </span>
            </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
