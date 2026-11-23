"use client";
import React, { useState } from "react";
import { Upload, Loader2, X } from "lucide-react";

// معرض صور المنتج: رفع عدة صور إضافية تظهر في صفحة المنتج بالمتجر
export default function MultiImagePicker({ value, onChange, label }: { value: string[]; onChange: (v: string[]) => void; label: string }) {
  const [uploading, setUploading] = useState(false);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const added: string[] = [];
    for (const file of files.slice(0, 8)) {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.path) added.push(d.path);
      else alert(d.error || "فشل رفع صورة");
    }
    setUploading(false);
    if (added.length) onChange([...value, ...added].slice(0, 8));
    e.target.value = "";
  };

  return (
    <div>
      <span className="text-sm font-bold">{label}</span>
      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        {value.map((src, i) => (
          <div key={`${src}-${i}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="إزالة الصورة"
              className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"><X size={12} /></button>
          </div>
        ))}
        {value.length < 8 && (
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm transition hover:bg-neutral-50">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? "جاري الرفع…" : "إضافة صور"}
            <input type="file" accept="image/*" multiple onChange={upload} className="hidden" />
          </label>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-neutral-400">حتى 8 صور إضافية تظهر كمعرض في صفحة المنتج.</p>
    </div>
  );
}
