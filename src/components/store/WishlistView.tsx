"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "./WishlistContext";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";

export default function WishlistView({ currency }: { currency: string }) {
  const { items } = useWishlist();
  const [fresh,setFresh]=useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(()=>{const c=new AbortController();if(!items.length){setFresh([]);return;}fetch("/api/wishlist-products?ids="+items.map(i=>i.id).join(","),{signal:c.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>setFresh(d.products||[])).catch(()=>{});return()=>c.abort();},[items]);

  if (!mounted) return <div className="mt-10 h-40 animate-pulse rounded-3xl bg-[var(--card)]" />;

  if (items.length === 0) {
    return (
      <div className="mt-10 grid place-items-center rounded-3xl bg-[var(--card)] py-24 text-center">
        <Heart size={56} strokeWidth={1.2} className="text-neutral-600" />
        <p className="mt-4 text-lg font-bold text-[var(--text-dim)]">مفضلتك فارغة</p>
        <p className="mt-1 text-sm text-[var(--text-faint)]">اضغط على القلب في أي منتج لحفظه هنا</p>
        <Link href="/products" className="mt-6 rounded-full bg-white px-8 py-3 font-bold text-black hover:bg-neutral-200 transition-colors">تصفح المنتجات</Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard
          key={p.id}
          currency={currency}
          product={{ ...p,options:p.options??"[{}]",...fresh.find(f=>f.id===p.id), description: "", category_id: null, images: "[]", featured: 0, active: 1, created_at: "" } as Product}
        />
      ))}
    </div>
  );
}
