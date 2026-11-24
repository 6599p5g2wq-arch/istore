"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

export default function ProductsToolbar({ categories, brands }: { categories: { name: string; slug: string }[]; brands?: { name: string; slug: string }[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const set = (key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => set("category", "")} className={`rounded-full px-4 py-2 text-sm font-bold transition ${!sp.get("category") ? "bg-white text-black" : "bg-[var(--chip)] text-[var(--text)] hover:bg-[var(--chip-hover)]"}`}>الكل</button>
        {categories.map((c) => (
          <button key={c.slug} onClick={() => set("category", c.slug)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${sp.get("category") === c.slug ? "bg-white text-black" : "bg-[var(--chip)] text-[var(--text)] hover:bg-[var(--chip-hover)]"}`}>{c.name}</button>
        ))}
        <div className="mr-auto flex max-w-full flex-wrap items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${showFilters ? "bg-[var(--accent)] text-white" : "bg-[var(--chip)] text-[var(--text)] hover:bg-[var(--chip-hover)]"}`}>
            <SlidersHorizontal size={15} /> فلاتر
          </button>
          {brands && brands.length > 0 && (
            <select
              value={sp.get("brand") || ""}
              onChange={(e) => set("brand", e.target.value)}
              className="min-w-0 max-w-full rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--text)] outline-none"
            >
              <option value="">كل الماركات</option>
              {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
            </select>
          )}
          <select
            value={sp.get("sort") || "newest"}
            onChange={(e) => set("sort", e.target.value)}
            className="min-w-0 max-w-full rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--text)] outline-none"
          >
            <option value="newest">الأحدث</option>
            <option value="price-asc">السعر: من الأقل</option>
            <option value="price-desc">السعر: من الأعلى</option>
            <option value="name">الاسم</option>
          </select>
        </div>
      </div>
      {showFilters && (
        <div className="mt-4 flex flex-wrap items-end gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <label className="text-sm font-bold text-[var(--text)]">
            أقل سعر
            <input type="number" min={0} defaultValue={sp.get("min") || ""} onBlur={(e) => set("min", e.target.value)} className="mt-1 block w-32 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]" placeholder="0" />
          </label>
          <label className="text-sm font-bold text-[var(--text)]">
            أعلى سعر
            <input type="number" min={0} defaultValue={sp.get("max") || ""} onBlur={(e) => set("max", e.target.value)} className="mt-1 block w-32 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]" placeholder="بدون حد" />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[var(--text)]">
            <input type="checkbox" checked={sp.get("offers") === "1"} onChange={(e) => set("offers", e.target.checked ? "1" : "")} className="h-4 w-4 accent-[var(--accent)]" />
            العروض فقط
          </label>
          <button onClick={() => router.push("/products")} className="flex items-center gap-1 rounded-full bg-[var(--chip)] px-4 py-2 text-sm font-bold text-red-400 hover:bg-[var(--chip-hover)]">
            <X size={14} /> مسح الفلاتر
          </button>
        </div>
      )}
    </div>
  );
}
