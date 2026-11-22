"use client";
import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "./CartContext";
import { formatPrice } from "@/lib/format";

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, setQty, remove, total } = useCart();
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={onClose}>
          <motion.aside
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute inset-y-0 left-0 flex w-96 max-w-[92vw] flex-col bg-[var(--surface)] shadow-2xl" onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
              <h2 className="text-lg font-bold text-white">سلة التسوق</h2>
              <button onClick={onClose} aria-label="إغلاق" className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-dim)] hover:bg-[var(--chip)]"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--text-dim)]">
                  <ShoppingBag size={48} strokeWidth={1.2} />
                  <p className="font-medium">سلتك فارغة</p>
                  <Link href="/products" onClick={onClose} className="mt-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-neutral-200 transition-colors">ابدأ التسوق</Link>
                </div>
              ) : (
                <ul className="flex flex-col gap-4">
                  <AnimatePresence initial={false}>
                    {items.map((it) => (
                      <motion.li key={it.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} className="flex gap-3 rounded-2xl border border-[var(--border)] bg-white/[0.04] p-3">
                        <Link href={`/product/${it.slug}`} onClick={onClose} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-2)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <Link href={`/product/${it.slug}`} onClick={onClose} className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text)]">{it.name}</Link>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-1 py-0.5">
                              <button onClick={() => setQty(it.id, it.qty + 1)} className="grid h-6 w-6 place-items-center rounded-full text-[var(--text)] hover:bg-[var(--chip)]" aria-label="زيادة"><Plus size={13} /></button>
                              <span className="w-5 text-center text-sm font-bold text-white">{it.qty}</span>
                              <button onClick={() => setQty(it.id, it.qty - 1)} className="grid h-6 w-6 place-items-center rounded-full text-[var(--text)] hover:bg-[var(--chip)]" aria-label="نقصان"><Minus size={13} /></button>
                            </div>
                            <span className="text-sm font-bold text-white">{formatPrice(it.price * it.qty)}</span>
                          </div>
                        </div>
                        <button onClick={() => remove(it.id)} aria-label="حذف" className="self-start text-neutral-600 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t border-[var(--border)] p-5">
                <div className="mb-4 flex items-center justify-between text-base">
                  <span className="text-[var(--text-dim)]">المجموع الفرعي</span>
                  <span className="text-xl font-extrabold text-white">{formatPrice(total)}</span>
                </div>
                <Link href="/checkout" onClick={onClose} className="glow-btn block rounded-full py-3.5 text-center font-bold hover:opacity-90 transition-opacity">إتمام الطلب</Link>
                <Link href="/cart" onClick={onClose} className="mt-2 block rounded-full border border-[var(--border-strong)] py-3 text-center text-sm font-bold text-[var(--text)] hover:bg-[var(--card)] transition-colors">عرض السلة</Link>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
