"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Product } from "@/lib/types";

export type WishItem = Pick<Product, "id" | "name" | "slug" | "price" | "old_price" | "image" | "stock" | "rating" | "badge" | "category_name">;

type Ctx = { items: WishItem[]; toggle: (p: WishItem) => void; has: (id: number) => boolean; count: number };
const WishlistCtx = createContext<Ctx>({ items: [], toggle: () => {}, has: () => false, count: 0 });

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishItem[]>([]);

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem("istore_wishlist") || "[]")); } catch { /* empty */ }
  }, []);

  const toggle = useCallback((p: WishItem) => {
    setItems((prev) => {
      const next = prev.some((i) => i.id === p.id) ? prev.filter((i) => i.id !== p.id) : [...prev, p];
      localStorage.setItem("istore_wishlist", JSON.stringify(next));
      return next;
    });
  }, []);

  const has = useCallback((id: number) => items.some((i) => i.id === id), [items]);

  return <WishlistCtx.Provider value={{ items, toggle, has, count: items.length }}>{children}</WishlistCtx.Provider>;
}

export const useWishlist = () => useContext(WishlistCtx);
