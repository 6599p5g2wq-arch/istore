"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteButton({ resource, id, label }: { resource: string; id: number; label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const del = async () => {
    if (!confirm(`حذف «${label}» نهائياً؟`)) return;
    setLoading(true);
    const r = await fetch(`/api/admin/${resource}/${id}`, { method: "DELETE" });
    setLoading(false);
    if (r.ok) router.refresh();
    else {
      const d = await r.json().catch(() => ({}));
      alert(d.error || "تعذر الحذف");
    }
  };

  return (
    <button onClick={del} disabled={loading} aria-label="حذف" className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-50">
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
    </button>
  );
}
