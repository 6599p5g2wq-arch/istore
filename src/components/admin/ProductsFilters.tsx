"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// بحث حي (بعد 350ms من آخر حرف) وفلاتر فورية بدون زر تطبيق
export default function ProductsFilters({ q, cat, sort, categories }: { q: string; cat: string; sort: string; categories: { id: number; name: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [text, setText] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = (patch: Record<string, string>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v); else p.delete(k);
    }
    p.delete("page");
    router.replace(`/admin/products${p.size ? `?${p.toString()}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    if (text === q) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push({ q: text.trim() }), 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const selCls = "rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-black";
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="ابحث بالاسم، الـ slug، التصنيف أو الماركة…"
        autoComplete="off"
        className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-black"
      />
      <select value={cat} onChange={(e) => push({ cat: e.target.value })} className={selCls}>
        <option value="">كل التصنيفات</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select value={sort} onChange={(e) => push({ sort: e.target.value === "new" ? "" : e.target.value })} className={selCls}>
        <option value="new">ترتيب: الأحدث</option>
        <option value="sold">الأكثر مبيعاً</option>
        <option value="price">السعر: الأعلى</option>
        <option value="stock">المخزون: الأقل</option>
      </select>
    </div>
  );
}
