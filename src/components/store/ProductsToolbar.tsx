"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

export default function ProductsToolbar({ categories }: { categories: { name: string; slug: string }[] }) {
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
        <button onClick={() => set("category", "")} className={`rounded-full px-4 py-2 text-sm font-bold transition ${!sp.get("category") ? "bg-black text-white" : "bg-neutral-100 hover:bg-neutral-200"}`}>الكل</button>
        {categories.map((c) => (
          <button key={c.slug} onClick={() => set("category", c.slug)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${sp.get("category") === c.slug ? "bg-black text-white" : "bg-neutral-100 hover:bg-neutral-200"}`}>{c.name}</button>
        ))}
        <div className="mr-auto flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${showFilters ? "bg-[var(--accent)] text-white" : "bg-neutral-100 hover:bg-neutral-200"}`}>
            <SlidersHorizontal size={15} /> فلاتر
          </button>
          <select
            value={sp.get("sort") || "newest"}
            onChange={(e) => set("sort", e.target.value)}
            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-bold outline-none"
          >
            <option value="newest">الأحدث</option>
            <option value="price-asc">السعر: من الأقل</option>
            <option value="price-desc">السعر: من الأعلى</option>
            <option value="name">الاسم</option>
          </select>
        </div>
      </div>
      {showFilters && (
        <div className="mt-4 flex flex-wrap items-end gap-4 rounded-2xl border border-neutral-100 bg-[#f5f5f7] p-5">
          <label className="text-sm font-bold">
            أقل سعر
            <input type="number" min={0} defaultValue={sp.get("min") || ""} onBlur={(e) => set("min", e.target.value)} className="mt-1 block w-32 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" placeholder="0" />
          </label>
          <label className="text-sm font-bold">
            أعلى سعر
            <input type="number" min={0} defaultValue={sp.get("max") || ""} onBlur={(e) => set("max", e.target.value)} className="mt-1 block w-32 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" placeholder="بدون حد" />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={sp.get("offers") === "1"} onChange={(e) => set("offers", e.target.checked ? "1" : "")} className="h-4 w-4 accent-[var(--accent)]" />
            العروض فقط
          </label>
          <button onClick={() => router.push("/products")} className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-red-500 shadow-sm hover:bg-red-50">
            <X size={14} /> مسح الفلاتر
          </button>
        </div>
      )}
    </div>
  );
}
