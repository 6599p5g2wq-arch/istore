"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

export type Field = { key: string; label: string; hint?: string; step?: number };

export default function ProgramPanel({ group, title, desc, enabled, values, fields }: { group: string; title: string; desc: string; enabled: boolean; values: Record<string, number>; fields: Field[] }) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [v, setV] = useState<Record<string, string>>(Object.fromEntries(fields.map((f) => [f.key, String(values[f.key])])));
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg("");
    const r = await fetch("/api/admin/program-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group, enabled: on, ...v }) });
    setLoading(false);
    if (r.ok) { setMsg("تم الحفظ"); router.refresh(); }
    else { const d = await r.json().catch(() => ({})); setMsg(d.error || "حدث خطأ"); }
  };
  const inputCls = "mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-black";

  return (
    <form onSubmit={save} className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-extrabold">{title}</h2>
          <p className="mt-1 text-xs text-neutral-500">{desc}</p>
        </div>
        <button type="button" role="switch" aria-checked={on} onClick={() => setOn(!on)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-emerald-500" : "bg-neutral-300"}`}>
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "right-0.5" : "right-[1.375rem]"}`} />
        </button>
      </div>
      <p className={`mt-2 text-xs font-bold ${on ? "text-emerald-600" : "text-neutral-400"}`}>{on ? "مفعّل" : "متوقف"}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="block text-sm font-bold">{f.label}
            <input type="number" step={f.step ?? 1} min={0} required value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} className={inputCls} />
            {f.hint && <span className="mt-1 block text-[11px] font-normal text-neutral-400">{f.hint}</span>}
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button disabled={loading} className="flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} حفظ
        </button>
        {msg && <span className="text-sm font-bold text-neutral-600">{msg}</span>}
      </div>
    </form>
  );
}
