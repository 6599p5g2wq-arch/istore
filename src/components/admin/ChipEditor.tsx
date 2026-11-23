"use client";
import React from "react";
import { Plus, Trash2 } from "lucide-react";

export type Chip = { icon: string; text: string };

export default function ChipEditor({ items, onChange, icons, addLabel }: { items: Chip[]; onChange: (c: Chip[]) => void; icons: { key: string; label: string }[]; addLabel: string }) {
  return (
    <div className="space-y-2">
      {items.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <select value={c.icon} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))} className="rounded-xl border border-neutral-200 bg-white px-2 py-2.5 text-sm font-bold">
            {icons.map((ic) => <option key={ic.key} value={ic.key}>{ic.label}</option>)}
          </select>
          <input className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-4 focus:ring-black/5" value={c.text} maxLength={40} placeholder="النص" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
          <button type="button" aria-label="حذف" onClick={() => onChange(items.filter((_, j) => j !== i))} className="rounded-full p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
        </div>
      ))}
      {items.length < 6 && (
        <button type="button" onClick={() => onChange([...items, { icon: "star", text: "" }])} className="inline-flex items-center gap-1 rounded-full border border-dashed border-neutral-300 px-4 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-50"><Plus size={15} /> {addLabel}</button>
      )}
    </div>
  );
}
