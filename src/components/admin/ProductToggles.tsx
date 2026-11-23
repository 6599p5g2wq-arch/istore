"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

// تبديل سريع «ظاهر/مميز» من القائمة مباشرة بدون فتح نموذج التعديل
export default function ProductToggles({ id, active, featured, only }: { id: number; active: boolean; featured: boolean; only?: "active" | "featured" }) {
  const router = useRouter();
  const [state, setState] = useState({ active, featured });
  const [busy, setBusy] = useState("");

  const toggle = async (field: "active" | "featured") => {
    if (busy) return;
    const value = !state[field];
    setState((s) => ({ ...s, [field]: value }));
    setBusy(field);
    const r = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value }),
    });
    setBusy("");
    if (!r.ok) {
      setState((s) => ({ ...s, [field]: !value }));
      alert("فشل التحديث");
    } else {
      router.refresh();
    }
  };

  const sw = (field: "active" | "featured", label: string) => (
    <button
      type="button"
      role="switch"
      aria-checked={state[field]}
      aria-label={label}
      title={label}
      disabled={busy === field}
      onClick={() => toggle(field)}
      className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${state[field] ? "bg-emerald-500" : "bg-neutral-300"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${state[field] ? "right-[22px]" : "right-0.5"}`} />
    </button>
  );

  if (only === "active") return sw("active", state.active ? "ظاهر في المتجر" : "مخفي");
  if (only === "featured") return sw("featured", state.featured ? "منتج مميز" : "غير مميز");
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold text-neutral-500">
      <span className="flex items-center gap-1.5">ظاهر {sw("active", "ظاهر في المتجر")}</span>
      <span className="flex items-center gap-1.5">مميز {sw("featured", "منتج مميز")}</span>
    </div>
  );
}
