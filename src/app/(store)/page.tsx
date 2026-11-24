import React from "react";
import {safeLink} from "@/lib/safe-link";
import Link from "next/link";
import { ChevronLeft, Flame, Grid3X3, Star, BadgePercent } from "lucide-react";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import Intro from "@/components/store/Intro";
import { readIntro } from "@/lib/intro";
import { readMarquee } from "@/lib/marquee";
import HeroSlider from "@/components/store/HeroSlider";
import Marquee from "@/components/store/Marquee";
import ProductCard from "@/components/store/ProductCard";
import Reveal from "@/components/store/Reveal";
import type { Category, HeroSlide, Product, Banner } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const db = getDb();
  const s = getSettings();
  const slides = db.prepare("SELECT * FROM hero_slides WHERE active = 1 ORDER BY sort_order").all() as HeroSlide[];
  const cats = db.prepare("SELECT * FROM categories WHERE active = 1 ORDER BY sort_order").all() as Category[];
  const featured = db.prepare(`SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.active = 1 AND p.featured = 1 ORDER BY p.created_at DESC LIMIT 8`).all() as Product[];
  const newest = db.prepare(`SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.active = 1 ORDER BY p.created_at DESC, p.id DESC LIMIT 8`).all() as Product[];
  const offers = db.prepare(`SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.active = 1 AND p.old_price IS NOT NULL AND p.old_price > p.price ORDER BY (p.old_price - p.price) DESC LIMIT 8`).all() as Product[];
  const banners = db.prepare("SELECT * FROM banners WHERE active = 1 ORDER BY sort_order LIMIT 3").all() as Banner[];
  const threshold = Number(s.free_shipping_threshold || 0);
  const intro = readIntro(s);
  const marquee = readMarquee(s);

  return (
    <div>
      {intro.enabled && <Intro cfg={intro} />}
      <HeroSlider slides={slides.map(s=>({...s,cta_link:safeLink(s.cta_link)}))} asH2={intro.enabled} />
      {marquee.enabled && <Marquee items={marquee.items} />}

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <Reveal>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--accent)]"><Grid3X3 size={16} /> تسوق حسب التصنيف</span>
              <h2 className="text-3xl font-black sm:text-4xl">تصنيفات المتجر</h2>
            </div>
            <Link href="/products" className="group hidden items-center gap-1 text-sm font-bold text-[var(--text-dim)] hover:text-[var(--text)] sm:flex">
              عرض الكل <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7 lg:gap-3">
          {cats.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.06}>
              <Link href={`/products?category=${c.slug}`} className="group block overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] text-center transition hover:border-white/25 hover:shadow-[0_16px_40px_-12px_rgba(0,113,227,.35)]">
                <div className="aspect-square overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <p className="p-3 text-sm font-bold text-[var(--text)]">{c.name}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <Reveal>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--accent)]"><Star size={16} /> مختاراتنا لك</span>
              <h2 className="text-3xl font-black sm:text-4xl">منتجات مميزة</h2>
            </div>
            <Link href="/products" className="group hidden items-center gap-1 text-sm font-bold text-[var(--text-dim)] hover:text-[var(--text)] sm:flex">
              عرض الكل <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {featured.map((p, i) => <ProductCard key={p.id} product={p} currency={s.currency} index={i} />)}
        </div>
      </section>

      {/* Promo banners */}
      {banners.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
          <div className={`grid gap-4 ${banners.length === 1 ? "" : banners.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
            {banners.map((b, i) => (
              <Reveal key={b.id} delay={i * 0.1}>
                <Link href={safeLink(b.link)} className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-l from-neutral-900 to-neutral-800 p-7 text-white shadow-lg">
                  <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-[var(--accent)] opacity-25 blur-2xl transition group-hover:opacity-40" />
                  {b.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.image} alt={b.title} loading="lazy" className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-white/20" />
                  ) : (
                    <BadgePercent size={36} className="shrink-0 text-white/80" />
                  )}
                  <div>
                    <h3 className="text-xl font-extrabold text-white">{b.title}</h3>
                    <p className="mt-1 text-sm text-white/70">{b.subtitle}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Offers */}
      {offers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
          <Reveal>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-red-400"><Flame size={16} /> وفر أكثر</span>
                <h2 className="text-3xl font-black sm:text-4xl">عروض وتخفيضات</h2>
              </div>
              <Link href="/products?offers=1" className="group hidden items-center gap-1 text-sm font-bold text-[var(--text-dim)] hover:text-[var(--text)] sm:flex">
                كل العروض <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {offers.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} currency={s.currency} index={i} />)}
          </div>
        </section>
      )}

      {/* Newest */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <Reveal>
          <div className="mb-8">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-400"><Star size={16} /> وصل حديثاً</span>
            <h2 className="text-3xl font-black sm:text-4xl">أحدث المنتجات</h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {newest.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} currency={s.currency} index={i} />)}
        </div>
      </section>

      {/* Free shipping CTA */}
      {threshold > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-[var(--accent)] p-10 text-center text-white sm:p-16">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--chip)] blur-2xl" />
              <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-black/10 blur-2xl" />
              <h2 className="relative text-3xl font-black sm:text-4xl">شحن مجاني للطلبات فوق {threshold} {s.currency}</h2>
              <p className="relative mx-auto mt-4 max-w-xl text-white/85">اطلب الآن واستفد من التوصيل المجاني السريع لأي مدينة في ليبيا — الدفع عند الاستلام.</p>
              <Link href="/products" className="relative mt-8 inline-block rounded-full bg-white px-10 py-4 font-bold text-black shadow-lg transition hover:scale-105">تسوق الآن</Link>
            </div>
          </Reveal>
        </section>
      )}
    </div>
  );
}
