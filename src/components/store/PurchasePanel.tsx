"use client";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Plus, Minus, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { formatPrice } from "@/lib/format";
import type { Product, ProductOption, ProductVariant } from "@/lib/types";

/**
 * Variant-aware purchase block: option selectors, live price/stock per
 * selection, qty stepper and add/buy buttons. Rendered only when the product
 * defines options; otherwise the page keeps the plain AddToCartPanel.
 */
export default function PurchasePanel({ product, options, variants, currency }: { product: Product; options: ProductOption[]; variants: ProductVariant[]; currency: string }) {
  const { add } = useCart();
  const router = useRouter();
  const [sel, setSel] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);

  const matched = useMemo(() => {
    if (!options.every((o) => sel[o.name])) return null;
    return variants.find((v) => options.every((o) => safeParse(v.options)[o.name] === sel[o.name])) || null;
  }, [sel, options, variants]);

  const price = matched?.price ?? product.price;
  const stock = matched ? matched.stock : null;
  const out = matched ? matched.stock <= 0 : false;

  // A value is selectable only if its resulting combination exists and has stock.
  const valueAvailable = (optName: string, value: string): boolean => {
    return variants.some((v) => {
      const vo = safeParse(v.options);
      return options.every((o) => {
        const wanted = o.name === optName ? value : sel[o.name];
        return !wanted || vo[o.name] === wanted;
      }) && v.stock > 0;
    });
  };

  const pick = (optName: string, value: string) => {
    const next: Record<string, string> = { ...sel };
    if (next[optName] === value) delete next[optName];
    else next[optName] = value;
    setSel(next);
    setQty(1);
    // Swap the main image when the newly completed selection has one.
    const m = variants.find((v) => options.every((o) => !next[o.name] || safeParse(v.options)[o.name] === next[o.name]) && options.every((o) => next[o.name]));
    window.dispatchEvent(new CustomEvent("variant-image", { detail: m?.image || "" }));
  };

  const buildItem = () => {
    if (!matched) return null;
    return {
      id: product.id, variant_id: matched.id, variant_label: matched.label,
      name: product.name, price, image: matched.image || product.image,
      slug: product.slug, stock: matched.stock,
    };
  };

  return (
    <div>
      <div className="mt-5 flex items-baseline gap-3">
        <span className="text-4xl font-black text-[var(--accent)]">{formatPrice(price, currency)}</span>
        {product.old_price && product.old_price > price && (
          <span className="text-xl text-[var(--text-faint)] line-through">{formatPrice(product.old_price, currency)}</span>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {options.map((o) => (
          <div key={o.name}>
            <p className="mb-2 text-sm font-bold text-[var(--text-dim)]">{o.name}{sel[o.name] ? <span className="text-white">: {sel[o.name]}</span> : ""}</p>
            <div className="flex flex-wrap gap-2">
              {o.values.map((v) => {
                const active = sel[o.name] === v;
                const avail = valueAvailable(o.name, v);
                return (
                  <button
                    key={v}
                    type="button"
                    disabled={!avail && !active}
                    onClick={() => pick(o.name, v)}
                    className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-lg"
                        : avail
                          ? "border-[var(--border-strong)] text-[var(--text)] hover:border-[var(--accent)]"
                          : "cursor-not-allowed border-[var(--border)] text-[var(--text-faint)] opacity-40 line-through"
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {!matched ? (
          <span className="inline-block rounded-full bg-[var(--chip)] px-4 py-2 text-sm font-bold text-[var(--text-dim)]">اختر {options.filter((o) => !sel[o.name]).map((o) => o.name).join(" و")} أولاً</span>
        ) : out ? (
          <span className="inline-block rounded-full bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400">نفدت الكمية — قريباً</span>
        ) : stock! <= 5 ? (
          <span className="inline-block rounded-full bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400">باقي {stock} فقط — اطلب الآن</span>
        ) : (
          <span className="inline-block rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400">متوفر في المخزون</span>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 rounded-full border-2 border-[var(--border-strong)] px-2 py-1.5">
          <button onClick={() => setQty(Math.min(qty + 1, stock ?? 99))} disabled={!matched || out} className="grid h-8 w-8 place-items-center rounded-full text-[var(--text)] hover:bg-[var(--chip)] disabled:opacity-40" aria-label="زيادة"><Plus size={16} /></button>
          <span className="w-8 text-center text-lg font-extrabold text-white">{qty}</span>
          <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={!matched || out} className="grid h-8 w-8 place-items-center rounded-full text-[var(--text)] hover:bg-[var(--chip)] disabled:opacity-40" aria-label="نقصان"><Minus size={16} /></button>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          disabled={!matched || out}
          onClick={() => { const it = buildItem(); if (it) add(it, qty); }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full py-4 font-bold shadow-lg transition sm:flex-none sm:px-10 ${!matched || out ? "cursor-not-allowed bg-[var(--chip)] text-neutral-600" : "bg-[var(--text)] text-[var(--bg)] hover:opacity-85"}`}
        >
          <ShoppingBag size={19} /> أضف إلى السلة
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          disabled={!matched || out}
          onClick={() => { const it = buildItem(); if (it) { add(it, qty); router.push("/checkout"); } }}
          className={`flex items-center justify-center gap-2 rounded-full px-8 py-4 font-bold shadow-lg transition ${!matched || out ? "cursor-not-allowed bg-neutral-200 text-[var(--text-dim)]" : "glow-btn hover:opacity-90"}`}
        >
          <Zap size={19} /> اشترِ الآن
        </motion.button>
      </div>
    </div>
  );
}

function safeParse(json: string): Record<string, string> {
  try { return JSON.parse(json || "{}"); } catch { return {}; }
}
