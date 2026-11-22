import React from "react";
import { CartProvider } from "@/components/store/CartContext";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import { getSettings } from "@/lib/settings";
import { getDb } from "@/lib/db";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const s = getSettings();
  const db = getDb();
  const cats = db.prepare("SELECT name, slug FROM categories WHERE active = 1 ORDER BY sort_order").all() as Pick<Category, "name" | "slug">[];
  return (
    <CartProvider>
      {s.announcement && (
        <div className="bg-black py-2.5 text-center text-xs font-bold text-white sm:text-sm">{s.announcement}</div>
      )}
      <Header storeName={s.store_name || "آي ستور"} categories={cats} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
    </CartProvider>
  );
}
