"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, X } from "lucide-react";

// تحديد جماعي لجدول المنتجات: يقرأ حالة مربعات .js-bulk من الجدول (المعروض من السيرفر)
// ويتكامل مع البحث الحي لأنه يعتمد على ظهور الصف، لا على الحالة الداخلية.
export default function BulkDeleteBar() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const visibleBoxes = () =>
      Array.from(document.querySelectorAll<HTMLInputElement>(".js-bulk")).filter(
        (cb) => (cb.closest("tr") as HTMLElement | null)?.style.display !== "none"
      );
    const sync = () => {
      const boxes = visibleBoxes();
      setCount(boxes.filter((cb) => cb.checked).length);
      const all = document.querySelector<HTMLInputElement>(".js-bulk-all");
      if (all) all.checked = boxes.length > 0 && boxes.every((cb) => cb.checked);
    };
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t.classList?.contains("js-bulk-all")) {
        visibleBoxes().forEach((cb) => { cb.checked = t.checked; });
      } else if (!t.classList?.contains("js-bulk")) {
        return;
      }
      sync();
    };
    // البحث الحي يخفي صفوفاً؛ نعيد الحساب عند أي كتابة في البحث
    const onInput = (e: Event) => {
      if ((e.target as HTMLElement).id === "products-search" || (e.target as HTMLInputElement).name === "q") sync();
    };
    document.addEventListener("change", onChange);
    document.addEventListener("input", onInput);
    sync();
    return () => {
      document.removeEventListener("change", onChange);
      document.removeEventListener("input", onInput);
    };
  }, []);

  const clearAll = () => {
    document.querySelectorAll<HTMLInputElement>(".js-bulk, .js-bulk-all").forEach((cb) => { cb.checked = false; });
    setCount(0);
  };

  const doDelete = async () => {
    const ids = Array.from(document.querySelectorAll<HTMLInputElement>(".js-bulk:checked")).map((cb) => Number(cb.value));
    if (ids.length === 0) return;
    setBusy(true);
    const r = await fetch("/api/admin/products/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setBusy(false);
    if (r.ok) {
      setConfirming(false);
      clearAll();
      router.refresh();
    } else {
      const d = await r.json().catch(() => ({}));
      alert(d.error || "تعذر الحذف");
    }
  };

  if (count === 0 && !confirming) return null;

  return (
    <>
      <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black px-5 py-3 text-sm font-bold text-white shadow-2xl">
        <span>تم تحديد {count} منتج</span>
        <button
          onClick={() => setConfirming(true)}
          className="flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 transition hover:bg-red-600"
        >
          <Trash2 size={15} /> حذف المحدد
        </button>
        <button onClick={clearAll} aria-label="إلغاء التحديد" className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition hover:bg-white/20">
          <X size={15} />
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => !busy && setConfirming(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-500"><Trash2 size={22} /></div>
            <h2 className="mt-4 text-lg font-black">حذف {count} منتج نهائياً؟</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              سيتم حذف المنتجات المحددة نهائياً ولا يمكن التراجع. الطلبات السابقة تبقى محفوظة ولن تتأثر.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={doDelete}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-500 py-3 font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} تأكيد الحذف
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="flex-1 rounded-full bg-neutral-100 py-3 font-bold transition hover:bg-neutral-200 disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
