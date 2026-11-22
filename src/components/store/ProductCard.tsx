"use client";
import React, { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Star } from "lucide-react";
import { useCart } from "./CartContext";
import WishlistButton from "./WishlistButton";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductCard({ product, currency = "د.ل", index }: { product: Product; currency?: string; index?: number }) {
  const { add } = useCart();
  const out = product.stock <= 0;
  const tiltRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);

  // 3D tilt follows the mouse. Skipped for touch pens/fingers so scrolling stays cheap on low-end phones.
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rx = (y / r.height - 0.5) * -9;
    const ry = (x / r.width - 0.5) * 9;
    el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px)`;
    const sh = shineRef.current;
    if (sh) {
      sh.style.opacity = "1";
      sh.style.background = `radial-gradient(480px circle at ${x}px ${y}px, rgba(122,160,255,.15), transparent 45%)`;
    }
  };
  const onLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "";
    if (shineRef.current) shineRef.current.style.opacity = "0";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: Math.min((index ?? 0) * 0.05, 0.35), ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        ref={tiltRef}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ transformStyle: "preserve-3d", transition: "transform .18s ease-out, box-shadow .3s ease, border-color .3s ease" }}
        className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-[0_10px_36px_rgba(0,0,0,.4)] hover:border-white/25 hover:shadow-[0_28px_60px_-14px_rgba(0,113,227,.45)]"
      >
        <div ref={shineRef} className="pointer-events-none absolute inset-0 z-10 rounded-3xl opacity-0 transition-opacity duration-300" />
        <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-[var(--surface-2)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
          {product.badge && (
            <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold text-white shadow ${product.badge === "خصم" ? "bg-red-500" : product.badge === "جديد" ? "bg-emerald-500" : "bg-[var(--accent)]"}`}>{product.badge}</span>
          )}
          {product.old_price && product.old_price > product.price && (
            <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-black">-{Math.round((1 - product.price / product.old_price) * 100)}%</span>
          )}
          <WishlistButton product={product} className="absolute bottom-3 left-3 z-10 opacity-100 transition-opacity duration-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100" />
        </Link>
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-1 flex items-center gap-1 text-xs text-amber-400">
            <Star size={13} fill="currentColor" />
            <span className="font-bold">{product.rating.toFixed(1)}</span>
            {product.category_name && <span className="mr-auto text-[var(--text-faint)]">{product.category_name}</span>}
          </div>
          <Link href={`/product/${product.slug}`} className="line-clamp-2 min-h-[2.6rem] text-sm font-semibold leading-snug text-[var(--text)] hover:text-[var(--accent)] transition-colors">{product.name}</Link>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <div className="text-lg font-extrabold text-white">{formatPrice(product.price, currency)}</div>
              {product.old_price && product.old_price > product.price && <div className="text-xs text-[var(--text-faint)] line-through">{formatPrice(product.old_price, currency)}</div>}
            </div>
            <motion.button
              whileTap={{ scale: 0.85 }}
              disabled={out}
              onClick={() => add({ id: product.id, name: product.name, price: product.price, image: product.image, slug: product.slug, stock: product.stock })}
              aria-label="أضف إلى السلة"
              className={`grid h-11 w-11 place-items-center rounded-full shadow-md transition ${out ? "cursor-not-allowed bg-[var(--chip)] text-neutral-600" : "bg-[var(--text)] text-[var(--bg)] hover:bg-[var(--accent)] hover:text-white"}`}
            >
              <ShoppingBag size={18} />
            </motion.button>
          </div>
          {out ? <p className="mt-2 text-xs font-bold text-red-400">نفدت الكمية</p> : product.stock <= 5 ? <p className="mt-2 text-xs font-bold text-orange-400">باقي {product.stock} فقط</p> : null}
        </div>
      </div>
    </motion.div>
  );
}
