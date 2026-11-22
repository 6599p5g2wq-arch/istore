import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import ProductCard from "@/components/store/ProductCard";
import Reveal from "@/components/store/Reveal";
import AddToCartPanel from "@/components/store/AddToCartPanel";
import ProductViewer from "@/components/store/ProductViewer";
import StockAlertForm from "@/components/store/StockAlertForm";
import ReviewForm from "@/components/store/ReviewForm";
import WhatsAppOrderButton from "@/components/store/WhatsAppOrderButton";
import WishlistButton from "@/components/store/WishlistButton";
import { ShieldCheck, Truck, RefreshCcw, Star, ChevronLeft, BadgeCheck } from "lucide-react";
import type { Product, Review } from "@/lib/types";
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
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug, b.name AS brand_name, b.slug AS brand_slug FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id WHERE p.slug = ? AND p.active = 1`
  ).get(params.slug) as (Product & { category_slug?: string }) | undefined;
  if (!product) notFound();

  const gallery: string[] = [product.image, ...JSON.parse(product.images || "[]")].filter(Boolean);
  const related = db.prepare(
    `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.active = 1 AND p.category_id = ? AND p.id != ? ORDER BY RANDOM() LIMIT 4`
  ).all(product.category_id, product.id) as Product[];

  const discount = product.old_price && product.old_price > product.price ? Math.round((1 - product.price / product.old_price) * 100) : 0;
  const reviews = db.prepare("SELECT * FROM reviews WHERE product_id = ? AND approved = 1 ORDER BY id DESC LIMIT 20").all(product.id) as Review[];
  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : product.rating;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <nav className="mb-8 flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/" className="hover:text-white">الرئيسية</Link>
        <ChevronLeft size={14} />
        <Link href="/products" className="hover:text-white">المنتجات</Link>
        {product.category_name && (
          <>
            <ChevronLeft size={14} />
            <Link href={`/products?category=${product.category_slug}`} className="hover:text-white">{product.category_name}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <Reveal>
          <div className="relative">
            <ProductViewer src={gallery[0]} alt={product.name} badge={product.badge} discount={discount} />
            <WishlistButton product={product} className="absolute bottom-4 left-4 z-10" />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {gallery.slice(1, 5).map((g, i) => (
                <div key={i} className="overflow-hidden rounded-2xl bg-[#12121c] ring-1 ring-white/10">
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
              {product.category_name && <Link href={`/products?category=${product.category_slug}`} className="rounded-full bg-white/10 px-3 py-1 font-bold text-neutral-300 hover:bg-white/15">{product.category_name}</Link>}
              {product.brand_name && <Link href={`/products?brand=${product.brand_slug}`} className="rounded-full bg-white/10 px-3 py-1 font-bold text-neutral-300 hover:bg-white/15">{product.brand_name}</Link>}
              <span className="flex items-center gap-1 text-amber-400"><Star size={15} fill="currentColor" /><b>{avgRating.toFixed(1)}</b>{reviews.length > 0 && <span className="text-neutral-500">({reviews.length})</span>}</span>
            </div>
            <h1 className="mt-4 text-3xl font-black leading-snug text-white sm:text-4xl">{product.name}</h1>
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-4xl font-black text-[var(--accent)]">{formatPrice(product.price, s.currency)}</span>
              {product.old_price && product.old_price > product.price && (
                <span className="text-xl text-neutral-500 line-through">{formatPrice(product.old_price, s.currency)}</span>
              )}
            </div>
            <p className="mt-6 whitespace-pre-line leading-8 text-neutral-400">{product.description}</p>

            <div className="mt-6">
              {product.stock <= 0 ? (
                <span className="inline-block rounded-full bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400">نفدت الكمية — قريباً</span>
              ) : product.stock <= 5 ? (
                <span className="inline-block rounded-full bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400">باقي {product.stock} فقط — اطلب الآن</span>
              ) : (
                <span className="inline-block rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400">متوفر في المخزون</span>
              )}
            </div>

            <AddToCartPanel product={product} />
            <WhatsAppOrderButton product={product} whatsapp={s.whatsapp} currency={s.currency} />
            {product.stock <= 0 && <StockAlertForm productId={product.id} />}

            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-8 text-center">
              {[
                { icon: Truck, t: "توصيل سريع", d: "24-72 ساعة" },
                { icon: ShieldCheck, t: "منتج أصلي", d: "مع ضمان" },
                { icon: RefreshCcw, t: "استبدال سهل", d: "خلال 7 أيام" },
              ].map((f) => (
                <div key={f.t} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <f.icon size={22} className="mx-auto text-[var(--accent)]" />
                  <p className="mt-2 text-sm font-bold text-neutral-100">{f.t}</p>
                  <p className="text-xs text-neutral-500">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* Verified reviews */}
      <section className="mt-20">
        <Reveal><h2 className="mb-8 text-2xl font-black text-white sm:text-3xl">تقييمات الزبائن {reviews.length > 0 && <span className="text-base font-bold text-neutral-500">({reviews.length})</span>}</h2></Reveal>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {reviews.length === 0 && <p className="rounded-2xl bg-white/5 p-8 text-center text-sm text-neutral-400">لا تقييمات بعد — كن أول من يقيّم بعد استلام طلبك.</p>}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-2">
                  <div className="flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={15} className={n <= r.rating ? "text-amber-400" : "text-neutral-700"} fill="currentColor" />)}</div>
                  <span className="text-sm font-bold text-white">{r.customer_name}</span>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400"><BadgeCheck size={12} /> مشترٍ موثق</span>
                </div>
                {r.comment && <p className="mt-3 text-sm leading-7 text-neutral-300">{r.comment}</p>}
              </div>
            ))}
          </div>
          <div><ReviewForm productId={product.id} /></div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-24">
          <Reveal><h2 className="mb-8 text-2xl font-black text-white sm:text-3xl">منتجات مشابهة</h2></Reveal>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p, i) => <ProductCard key={p.id} product={p} currency={s.currency} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
