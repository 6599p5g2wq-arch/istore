"use client";
import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart } from "./CartContext";
import { formatPrice } from "@/lib/format";

export default function CartView() {
  const { items, setQty, remove, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="mt-10 grid place-items-center rounded-3xl bg-[var(--card)] py-24 text-center">
        <ShoppingBag size={56} strokeWidth={1.2} className="text-neutral-600" />
        <p className="mt-4 text-lg font-bold text-[var(--text-dim)]">سلتك فارغة</p>
        <Link href="/products" className="mt-6 rounded-full bg-white px-8 py-3 font-bold text-black hover:bg-neutral-200 transition-colors">ابدأ التسوق</Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-3">
      <ul className="flex flex-col gap-4 lg:col-span-2">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.li key={it.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 60 }} className="flex gap-4 rounded-3xl border border-[var(--border)] bg-white/[0.04] p-4">
              <Link href={`/product/${it.slug}`} className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-[var(--surface-2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/product/${it.slug}`} className="line-clamp-2 font-bold leading-snug text-[var(--text)] hover:text-[var(--accent)]">{it.name}</Link>
                <span className="mt-1 text-sm text-[var(--text-faint)]">{formatPrice(it.price)} للقطعة</span>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center gap-3 rounded-full border border-[var(--border-strong)] px-2 py-1">
                    <button onClick={() => setQty(it.id, it.qty + 1)} className="grid h-7 w-7 place-items-center rounded-full text-[var(--text)] hover:bg-[var(--chip)]" aria-label="زيادة"><Plus size={14} /></button>
                    <span className="w-6 text-center font-extrabold text-white">{it.qty}</span>
                    <button onClick={() => setQty(it.id, it.qty - 1)} className="grid h-7 w-7 place-items-center rounded-full text-[var(--text)] hover:bg-[var(--chip)]" aria-label="نقصان"><Minus size={14} /></button>
                  </div>
                  <span className="text-lg font-extrabold text-white">{formatPrice(it.price * it.qty)}</span>
                </div>
              </div>
              <button onClick={() => remove(it.id)} aria-label="حذف" className="self-start text-neutral-600 transition hover:text-red-400"><Trash2 size={18} /></button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <div className="h-fit rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-extrabold text-white">ملخص الطلب</h2>
        <div className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between text-[var(--text-dim)]"><span>المجموع الفرعي</span><span className="font-bold text-white">{formatPrice(total)}</span></div>
          <div className="flex justify-between text-[var(--text-dim)]"><span>التوصيل</span><span className="font-bold text-white">يُحسب عند إتمام الطلب</span></div>
        </div>
        <div className="mt-4 flex justify-between border-t border-[var(--border)] pt-4 text-lg">
          <span className="font-bold text-white">الإجمالي التقريبي</span>
          <span className="font-extrabold text-[var(--accent)]">{formatPrice(total)}</span>
        </div>
        <Link href="/checkout" className="glow-btn mt-6 flex items-center justify-center gap-2 rounded-full py-3.5 font-bold transition hover:opacity-90">
          إتمام الطلب <ArrowLeft size={17} />
        </Link>
        <Link href="/products" className="mt-3 block text-center text-sm font-bold text-[var(--text-dim)] hover:text-[var(--text)]">متابعة التسوق</Link>
      </div>
    </div>
  );
}
