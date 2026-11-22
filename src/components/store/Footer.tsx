import React from "react";
import Link from "next/link";
import { Apple, Phone, Mail, MapPin, Facebook, Instagram, Music2, Clock } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getDb } from "@/lib/db";
import type { Category } from "@/lib/types";

export default function Footer() {
  const s = getSettings();
  const db = getDb();
  const cats = db.prepare("SELECT name, slug FROM categories WHERE active = 1 ORDER BY sort_order").all() as Pick<Category, "name" | "slug">[];
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-neutral-100 bg-[#f5f5f7]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-xl font-extrabold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-black text-white"><Apple size={20} /></span>
              {s.store_name}
            </div>
            <p className="mt-4 text-sm leading-7 text-neutral-500">{s.store_tagline}</p>
            <div className="mt-5 flex gap-2">
              {s.facebook && <a href={s.facebook} target="_blank" rel="noreferrer" aria-label="فيسبوك" className="grid h-10 w-10 place-items-center rounded-full bg-white text-neutral-600 shadow-sm transition hover:-translate-y-0.5 hover:text-[var(--accent)]"><Facebook size={18} /></a>}
              {s.instagram && <a href={s.instagram} target="_blank" rel="noreferrer" aria-label="انستغرام" className="grid h-10 w-10 place-items-center rounded-full bg-white text-neutral-600 shadow-sm transition hover:-translate-y-0.5 hover:text-[var(--accent)]"><Instagram size={18} /></a>}
              {s.tiktok && <a href={s.tiktok} target="_blank" rel="noreferrer" aria-label="تيك توك" className="grid h-10 w-10 place-items-center rounded-full bg-white text-neutral-600 shadow-sm transition hover:-translate-y-0.5 hover:text-[var(--accent)]"><Music2 size={18} /></a>}
            </div>
          </div>
          <div>
            <h3 className="mb-4 font-bold">التصنيفات</h3>
            <ul className="space-y-2.5 text-sm text-neutral-500">
              {cats.map((c) => <li key={c.slug}><Link className="hover:text-black transition-colors" href={`/products?category=${c.slug}`}>{c.name}</Link></li>)}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-bold">روابط سريعة</h3>
            <ul className="space-y-2.5 text-sm text-neutral-500">
              <li><Link className="hover:text-black transition-colors" href="/products">كل المنتجات</Link></li>
              <li><Link className="hover:text-black transition-colors" href="/track">تتبع طلبك</Link></li>
              <li><Link className="hover:text-black transition-colors" href="/cart">سلة التسوق</Link></li>
              <li><Link className="hover:text-black transition-colors" href="/about">من نحن</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-bold">تواصل معنا</h3>
            <ul className="space-y-3 text-sm text-neutral-500">
              <li className="flex items-center gap-2.5"><Phone size={16} className="text-[var(--accent)]" /><span dir="ltr">{s.phone}</span></li>
              <li className="flex items-center gap-2.5"><Mail size={16} className="text-[var(--accent)]" />{s.email}</li>
              <li className="flex items-center gap-2.5"><MapPin size={16} className="text-[var(--accent)]" />{s.address}</li>
              <li className="flex items-center gap-2.5"><Clock size={16} className="text-[var(--accent)]" />{s.working_hours}</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-neutral-200 pt-6 text-xs text-neutral-400 sm:flex-row">
          <p>© {year} {s.store_name} — {s.footer_text}</p>
          <p>الدفع عند الاستلام متاح لكل المدن الليبية</p>
        </div>
      </div>
    </footer>
  );
}
