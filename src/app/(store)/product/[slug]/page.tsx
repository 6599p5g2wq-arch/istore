import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import ProductCard from "@/components/store/ProductCard";
import Reveal from "@/components/store/Reveal";
import AddToCartPanel from "@/components/store/AddToCartPanel";
import { ShieldCheck, Truck, RefreshCcw, Star, ChevronLeft } from "lucide-react";
import type { Product } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const db = getDb();
  const p = db.prepare("SELECT name, description FROM products WHERE slug = ?").get(params.slug) as { name: string; description: string } | undefined;
  return p ? { title: p.name, description: p.description.slice(0, 150) } : { title: "منتج غير موجود" };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const db = getDb();
  const s = getSettings();
  const product = db.prepare(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.slug = ? AND p.active = 1`
  ).get(params.slug) as (Product & { category_slug?: string }) | undefined;
  if (!product) notFound();

  const gallery: string[] = [product.image, ...JSON.parse(product.images || "[]")].filter(Boolean);
  const related = db.prepare(
    `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.active = 1 AND p.category_id = ? AND p.id != ? ORDER BY RANDOM() LIMIT 4`
  ).all(product.category_id, product.id) as Product[];

  const discount = product.old_price && product.old_price > product.price ? Math.round((1 - product.price / product.old_price) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <nav className="mb-8 flex items-center gap-1.5 text-sm text-neutral-400">
        <Link href="/" className="hover:text-black">الرئيسية</Link>
        <ChevronLeft size={14} />
        <Link href="/products" className="hover:text-black">المنتجات</Link>
        {product.category_name && (
          <>
            <ChevronLeft size={14} />
            <Link href={`/products?category=${product.category_slug}`} className="hover:text-black">{product.category_name}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#f5f5f7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gallery[0]} alt={product.name} className="aspect-square w-full object-cover" />
            {product.badge && <span className="absolute right-4 top-4 rounded-full bg-black px-4 py-1.5 text-xs font-bold text-white">{product.badge}</span>}
            {discount > 0 && <span className="absolute left-4 top-4 rounded-full bg-red-500 px-4 py-1.5 text-xs font-bold text-white">خصم {discount}%</span>}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {gallery.slice(1, 5).map((g, i) => (
                <div key={i} className="overflow-hidden rounded-2xl bg-[#f5f5f7]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g} alt="" className="aspect-square w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </Reveal>

        <Reveal delay={0.1}>
          <div>
            <div className="flex items-center gap-3 text-sm">
              {product.category_name && <Link href={`/products?category=${product.category_slug}`} className="rounded-full bg-neutral-100 px-3 py-1 font-bold text-neutral-600 hover:bg-neutral-200">{product.category_name}</Link>}
              <span className="flex items-center gap-1 text-amber-500"><Star size={15} fill="currentColor" /><b>{product.rating.toFixed(1)}</b></span>
            </div>
            <h1 className="mt-4 text-3xl font-black leading-snug sm:text-4xl">{product.name}</h1>
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-4xl font-black text-[var(--accent)]">{formatPrice(product.price, s.currency)}</span>
              {product.old_price && product.old_price > product.price && (
                <span className="text-xl text-neutral-400 line-through">{formatPrice(product.old_price, s.currency)}</span>
              )}
            </div>
            <p className="mt-6 whitespace-pre-line leading-8 text-neutral-600">{product.description}</p>

            <div className="mt-6">
              {product.stock <= 0 ? (
                <span className="inline-block rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-600">نفدت الكمية — قريباً</span>
              ) : product.stock <= 5 ? (
                <span className="inline-block rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600">باقي {product.stock} فقط — اطلب الآن</span>
              ) : (
                <span className="inline-block rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600">متوفر في المخزون</span>
              )}
            </div>

            <AddToCartPanel product={product} />

            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-8 text-center">
              {[
                { icon: Truck, t: "توصيل سريع", d: "24-72 ساعة" },
                { icon: ShieldCheck, t: "منتج أصلي", d: "مع ضمان" },
                { icon: RefreshCcw, t: "استبدال سهل", d: "خلال 7 أيام" },
              ].map((f) => (
                <div key={f.t} className="rounded-2xl bg-[#f5f5f7] p-4">
                  <f.icon size={22} className="mx-auto text-[var(--accent)]" />
                  <p className="mt-2 text-sm font-bold">{f.t}</p>
                  <p className="text-xs text-neutral-500">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <Reveal><h2 className="mb-8 text-2xl font-black sm:text-3xl">منتجات مشابهة</h2></Reveal>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} currency={s.currency} />)}
          </div>
        </section>
      )}
    </div>
  );
}
