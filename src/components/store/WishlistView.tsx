"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "./WishlistContext";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";

export default function WishlistView({ currency }: { currency: string }) {
  const { items } = useWishlist();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="mt-10 h-40 animate-pulse rounded-3xl bg-white/5" />;

  if (items.length === 0) {
    return (
      <div className="mt-10 grid place-items-center rounded-3xl bg-white/5 py-24 text-center">
        <Heart size={56} strokeWidth={1.2} className="text-neutral-600" />
        <p className="mt-4 text-lg font-bold text-neutral-400">مفضلتك فارغة</p>
        <p className="mt-1 text-sm text-neutral-500">اضغط على القلب في أي منتج لحفظه هنا</p>
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
          product={{ ...p, description: "", category_id: null, images: "[]", featured: 0, active: 1, created_at: "" } as Product}
        />
      ))}
    </div>
  );
}
