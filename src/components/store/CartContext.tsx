"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = { id: number; name: string; price: number; image: string; slug: string; qty: number; stock: number };

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("istore_cart");
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("istore_cart", JSON.stringify(items));
  }, [items, loaded]);

  const api = useMemo<CartCtx>(() => ({
    items,
    open,
    setOpen,
    add: (item, qty = 1) => {
      setItems((prev) => {
        const ex = prev.find((p) => p.id === item.id);
        if (ex) return prev.map((p) => (p.id === item.id ? { ...p, qty: Math.min(p.qty + qty, p.stock || 99) } : p));
        return [...prev, { ...item, qty }];
      });
      setOpen(true);
    },
    remove: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
    setQty: (id, qty) => setItems((prev) => (qty <= 0 ? prev.filter((p) => p.id !== id) : prev.map((p) => (p.id === id ? { ...p, qty: Math.min(qty, p.stock || 99) } : p)))),
    clear: () => setItems([]),
    count: items.reduce((a, b) => a + b.qty, 0),
    total: items.reduce((a, b) => a + b.qty * b.price, 0),
  }), [items, open]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart outside provider");
  return ctx;
}
