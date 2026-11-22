"use client";
import React, { useState } from "react";
import { Upload, Loader2, X } from "lucide-react";

export default function ImagePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [uploading, setUploading] = useState(false);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    setUploading(false);
    if (r.ok && d.path) onChange(d.path);
    else alert(d.error || "فشل رفع الصورة");
    e.target.value = "";
  };

  return (
    <div>
      <span className="text-sm font-bold">{label}</span>
      <div className="mt-1.5 flex items-center gap-3">
        {value ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange("")} aria-label="إزالة" className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"><X size={12} /></button>
          </div>
        ) : null}
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm transition hover:bg-neutral-50">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? "جاري الرفع…" : "رفع صورة"}
          <input type="file" accept="image/*" onChange={upload} className="hidden" />
        </label>
      </div>
      <input dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} placeholder="/images/example.jpg أو رابط خارجي" className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-left text-xs text-neutral-500 outline-none focus:border-black" />
    </div>
  );
}
