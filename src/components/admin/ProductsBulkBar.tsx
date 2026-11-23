"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, X, Eye, EyeOff, Star, StarOff } from "lucide-react";

// شريط إجراءات جماعية لجدول المنتجات: حذف + إظهار/إخفاء + تمييز/إلغاء تمييز
export default function ProductsBulkBar() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    const boxes = () => Array.from(document.querySelectorAll<HTMLInputElement>(".js-bulk"));
    const sync = () => {
      const b = boxes();
      setCount(b.filter((cb) => cb.checked).length);
      const all = document.querySelector<HTMLInputElement>(".js-bulk-all");
      if (all) all.checked = b.length > 0 && b.every((cb) => cb.checked);
    };
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t.classList?.contains("js-bulk-all")) {
        boxes().forEach((cb) => { cb.checked = t.checked; });
      } else if (!t.classList?.contains("js-bulk")) {
        return;
      }
      sync();
    };
    document.addEventListener("change", onChange);
    sync();
    return () => document.removeEventListener("change", onChange);
  }, []);

  const selectedIds = () =>
    Array.from(document.querySelectorAll<HTMLInputElement>(".js-bulk")).filter((cb) => cb.checked).map((cb) => Number(cb.value));

  const clearSelection = () => {
    document.querySelectorAll<HTMLInputElement>(".js-bulk, .js-bulk-all").forEach((cb) => { cb.checked = false; });
    setCount(0);
    setConfirming(false);
  };

  const run = async (action: string) => {
    if (busy) return;
    setBusy(action);
    const url = action === "delete" ? "/api/admin/products/bulk-delete" : "/api/admin/products/bulk-update";
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds(), action }),
    });
    setBusy("");
    if (r.ok) { clearSelection(); router.refresh(); }
    else alert("فشل تنفيذ الإجراء");
  };

  if (count === 0) return null;

  const actBtn = (action: string, label: string, icon: React.ReactNode, cls = "") => (
    <button onClick={() => run(action)} disabled={!!busy}
      className={`flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-60 ${cls}`}>
      {busy === action ? <Loader2 size={13} className="animate-spin" /> : icon} {label}
    </button>
  );

  return (
    <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black px-3 py-2.5 shadow-2xl">
      <span className="px-2 text-xs font-bold text-white">تم تحديد {count}</span>
      {actBtn("activate", "إظهار", <Eye size={13} />)}
      {actBtn("hide", "إخفاء", <EyeOff size={13} />)}
      {actBtn("feature", "تمييز", <Star size={13} />)}
      {actBtn("unfeature", "إلغاء التمييز", <StarOff size={13} />)}
      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-red-700">
          <Trash2 size={13} /> حذف
        </button>
      ) : (
        <button onClick={() => run("delete")} disabled={!!busy} className="flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-red-700 disabled:opacity-60">
          {busy === "delete" ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} تأكيد الحذف النهائي
        </button>
      )}
      <button onClick={clearSelection} aria-label="إلغاء التحديد" className="grid h-8 w-8 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"><X size={14} /></button>
    </div>
  );
}
