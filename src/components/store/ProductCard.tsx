"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Star } from "lucide-react";
import { useCart } from "./CartContext";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductCard({ product, currency = "د.ل" }: { product: Product; currency?: string }) {
  const { add } = useCart();
  const out = product.stock <= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm transition-shadow hover:shadow-xl hover:shadow-neutral-200"
    >
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-[#f5f5f7]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
        {product.badge && (
          <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold text-white shadow ${product.badge === "خصم" ? "bg-red-500" : product.badge === "جديد" ? "bg-emerald-500" : "bg-[var(--accent)]"}`}>{product.badge}</span>
        )}
        {product.old_price && product.old_price > product.price && (
          <span className="absolute left-3 top-3 rounded-full bg-black px-2.5 py-1 text-[11px] font-bold text-white">-{Math.round((1 - product.price / product.old_price) * 100)}%</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-1 text-xs text-amber-500">
          <Star size={13} fill="currentColor" />
          <span className="font-bold">{product.rating.toFixed(1)}</span>
          {product.category_name && <span className="mr-auto text-neutral-400">{product.category_name}</span>}
        </div>
        <Link href={`/product/${product.slug}`} className="line-clamp-2 min-h-[2.6rem] text-sm font-semibold leading-snug hover:text-[var(--accent)] transition-colors">{product.name}</Link>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <div className="text-lg font-extrabold">{formatPrice(product.price, currency)}</div>
            {product.old_price && product.old_price > product.price && <div className="text-xs text-neutral-400 line-through">{formatPrice(product.old_price, currency)}</div>}
          </div>
          <motion.button
            whileTap={{ scale: 0.85 }}
            disabled={out}
            onClick={() => add({ id: product.id, name: product.name, price: product.price, image: product.image, slug: product.slug, stock: product.stock })}
            aria-label="أضف إلى السلة"
            className={`grid h-11 w-11 place-items-center rounded-full text-white shadow-md transition ${out ? "cursor-not-allowed bg-neutral-300" : "bg-black hover:bg-[var(--accent)]"}`}
          >
            <ShoppingBag size={18} />
          </motion.button>
        </div>
        {out ? <p className="mt-2 text-xs font-bold text-red-500">نفدت الكمية</p> : product.stock <= 5 ? <p className="mt-2 text-xs font-bold text-orange-500">باقي {product.stock} فقط</p> : null}
      </div>
    </motion.div>
  );
}
