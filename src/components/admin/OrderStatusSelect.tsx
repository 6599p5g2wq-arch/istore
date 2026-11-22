"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const CLS: Record<string, string> = {
  new: "bg-amber-100 text-amber-700", confirmed: "bg-blue-100 text-blue-700", shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-700",
};

export default function OrderStatusSelect({ id, status, labels }: { id: number; status: string; labels: Record<string, string> }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  const change = async (v: string) => {
    setValue(v); setSaving(true);
    await fetch(`/api/admin/orders/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: v }) });
    setSaving(false);
    router.refresh();
  };

  return (
    <select value={value} disabled={saving} onChange={(e) => change(e.target.value)}
      className={`rounded-full border-0 px-3 py-1.5 text-xs font-extrabold outline-none transition disabled:opacity-50 ${CLS[value] || "bg-neutral-100"}`}>
      {Object.entries(labels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
  );
}
