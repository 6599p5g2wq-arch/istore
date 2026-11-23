"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";

// نسخ المنتج بكل بياناته (الاسم يُلحق بـ«نسخة» والـ slug بلاحقة) ثم يفتح نموذج التعديل
export default function DuplicateButton({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const duplicate = async () => {
    if (busy) return;
    setBusy(true);
    const r = await fetch(`/api/admin/products/${id}/duplicate`, { method: "POST" });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok && d.id) { router.push(`/admin/products/${d.id}`); router.refresh(); }
    else alert(d.error || "فشل نسخ المنتج");
  };

  return (
    <button type="button" onClick={duplicate} disabled={busy} aria-label="نسخ المنتج" title="نسخ المنتج"
      className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white disabled:opacity-60">
      {busy ? <Loader2 size={15} className="animate-spin" /> : <Copy size={15} />}
    </button>
  );
}
