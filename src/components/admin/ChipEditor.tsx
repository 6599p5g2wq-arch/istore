"use client";
import React from "react";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

export type Chip = { icon: string; text: string };

export default function ChipEditor({ items, onChange, icons, addLabel }: { items: Chip[]; onChange: (c: Chip[]) => void; icons: { key: string; label: string }[]; addLabel: string }) {
  return (
    <div className="space-y-2">
      {items.map((c, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl bg-neutral-50 p-2">
          <div className="flex shrink-0">{[-1,1].map(d=><button key={d} type="button" aria-label={d<0?"أعلى":"أسفل"} disabled={i+d<0||i+d>=items.length} className="p-1 disabled:opacity-25" onClick={()=>{const a=[...items];[a[i],a[i+d]]=[a[i+d],a[i]];onChange(a);}}>{d<0?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button>)}</div>
          <select value={c.icon} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))} className="rounded-xl border border-neutral-200 bg-white px-2 py-2.5 text-sm font-bold">
            {icons.map((ic) => <option key={ic.key} value={ic.key}>{ic.label}</option>)}
          </select>
          <input className="min-w-0 flex-1 basis-32 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-4 focus:ring-black/5" value={c.text} maxLength={40} placeholder="النص" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
          <button type="button" aria-label="حذف" onClick={() => onChange(items.filter((_, j) => j !== i))} className="rounded-full p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
        </div>
      ))}
      <div aria-label="معاينة الشرائح" className="flex flex-wrap gap-2 rounded-xl border border-dashed p-3">{items.filter(x=>x.text.trim()).map((x,i)=><span key={i} className="rounded-full bg-black px-3 py-1 text-xs text-white">{icons.find(k=>k.key===x.icon)?.label} · {x.text}</span>)}</div>
      {items.length < 6 && (
        <button type="button" onClick={() => onChange([...items, { icon: "star", text: "" }])} className="inline-flex items-center gap-1 rounded-full border border-dashed border-neutral-300 px-4 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-50"><Plus size={15} /> {addLabel}</button>
      )}
    </div>
  );
}
