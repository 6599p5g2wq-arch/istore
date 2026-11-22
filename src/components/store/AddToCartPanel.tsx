"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Plus, Minus, Zap } from "lucide-react";
import { useCart } from "./CartContext";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";

export default function AddToCartPanel({ product }: { product: Product }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const out = product.stock <= 0;
  const item = { id: product.id, name: product.name, price: product.price, image: product.image, slug: product.slug, stock: product.stock };

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3 rounded-full border-2 border-neutral-200 px-2 py-1.5">
        <button onClick={() => setQty(Math.min(qty + 1, product.stock || 99))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-neutral-100" aria-label="زيادة"><Plus size={16} /></button>
        <span className="w-8 text-center text-lg font-extrabold">{qty}</span>
        <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-neutral-100" aria-label="نقصان"><Minus size={16} /></button>
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        disabled={out}
        onClick={() => add(item, qty)}
        className={`flex flex-1 items-center justify-center gap-2 rounded-full py-4 font-bold text-white shadow-lg transition sm:flex-none sm:px-10 ${out ? "cursor-not-allowed bg-neutral-300" : "bg-black hover:bg-neutral-800"}`}
      >
        <ShoppingBag size={19} /> أضف إلى السلة
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.96 }}
        disabled={out}
        onClick={() => { add(item, qty); router.push("/checkout"); }}
        className={`flex items-center justify-center gap-2 rounded-full py-4 font-bold shadow-lg transition px-8 ${out ? "cursor-not-allowed bg-neutral-200 text-neutral-400" : "bg-[var(--accent)] text-white hover:opacity-90"}`}
      >
        <Zap size={19} /> اشترِ الآن
      </motion.button>
    </div>
  );
}
