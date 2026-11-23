"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Check } from "lucide-react";
import { useCart } from "./CartContext";

const STEPS = [
  { key: "new", label: "قيد المراجعة" },
  { key: "confirmed", label: "مؤكد" },
  { key: "shipped", label: "في الطريق" },
  { key: "delivered", label: "تم التوصيل" },
];

export default function OrderTimeline({ code, status }: { code: string; status: string }) {
  const { add } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const idx = STEPS.findIndex((s) => s.key === status);

  const reorder = async () => {
    setLoading(true); setNote("");
    const r = await fetch(`/api/account/reorder/${code}`);
    const d = await r.json().catch(() => ({}));
    setLoading(false);
    if (!r.ok) { setNote(d.error || "تعذر إعادة الطلب"); return; }
    if (!d.items?.length) { setNote("منتجات هذا الطلب غير متوفرة حالياً"); return; }
    for (const it of d.items) { const { qty, ...item } = it; add(item, qty); }
    if (d.skipped) setNote(`أُضيفت المنتجات المتوفرة، و${d.skipped} غير متوفر حالياً`);
    router.push("/cart");
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-[var(--border)] pt-3">
      {status === "cancelled" ? (
        <span className="text-xs font-bold text-red-400">تم إلغاء هذا الطلب</span>
      ) : (
        <ol className="flex flex-1 items-center gap-1 text-[11px] font-bold">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex flex-1 items-center gap-1">
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${i <= idx ? "bg-emerald-500 text-black" : "bg-[var(--chip)] text-[var(--text-dim)]"}`}>{i <= idx ? <Check size={11} /> : i + 1}</span>
              <span className={`hidden sm:inline ${i <= idx ? "text-white" : "text-[var(--text-dim)]"}`}>{s.label}</span>
              {i < STEPS.length - 1 && <span className={`h-px flex-1 ${i < idx ? "bg-emerald-500" : "bg-[var(--border-strong)]"}`} />}
            </li>
          ))}
        </ol>
      )}
      <button onClick={reorder} disabled={loading} className="flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[var(--chip)] disabled:opacity-60">
        {loading ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} اطلب مجدداً
      </button>
      {note && <p className="w-full text-xs text-amber-400">{note}</p>}
    </div>
  );
}
