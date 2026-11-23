"use client";
import React, { useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { readIntro } from "@/lib/intro";

type Form = Record<string, string>;
const inputCls = "mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900";

export default function IntroCard({ form, setForm }: { form: Form; setForm: (f: Form) => void }) {
  const cfg = readIntro(form);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const upload = async (f: File) => {
    setBusy(true); setMsg("");
    const fd = new FormData(); fd.append("file", f);
    const r = await fetch("/api/control/intro-logo", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setMsg(j.error || "فشل الرفع"); return; }
    setForm({ ...form, intro_logo: j.path });
    setMsg("تم رفع الشعار وتجهيزه (يظهر في المتجر فوراً)");
  };
  const removeLogo = async () => {
    setBusy(true);
    await fetch("/api/control/intro-logo", { method: "DELETE" });
    setBusy(false); setForm({ ...form, intro_logo: "" }); setMsg("تم حذف الشعار");
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">المقدمة الافتتاحية (قبل السلايدر)</h2>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" className="h-4 w-4" checked={cfg.enabled} onChange={(e) => set("intro_enabled", e.target.checked ? "1" : "0")} />
          {cfg.enabled ? "مفعّلة" : "متوقفة"}
        </label>
      </div>
      <p className="mb-4 text-xs text-neutral-500">شاشة واحدة بنفس خلفية الموقع (تتبع الوضع الليلي/النهاري). عند تركها فارغة يُستخدم اسم المتجر ووصفه. شرائح العروض وشريط المميزات تُعدَّل من لوحة الإدارة، صفحة «الإعدادات».</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold">العنوان الكبير<input className={inputCls} value={form.intro_title || ""} placeholder={form.store_name || "اسم المتجر"} maxLength={60} onChange={(e) => set("intro_title", e.target.value)} /></label>
        <label className="block text-sm font-bold">الشارة الصغيرة (فارغة = إخفاء)<input className={inputCls} value={form.intro_pill ?? cfg.pill} maxLength={40} onChange={(e) => set("intro_pill", e.target.value)} /></label>
        <label className="block text-sm font-bold sm:col-span-2">الوصف المختصر<textarea rows={2} className={`${inputCls} resize-none`} value={form.intro_tagline || ""} placeholder={form.store_tagline || ""} maxLength={160} onChange={(e) => set("intro_tagline", e.target.value)} /></label>

        <div className="text-sm font-bold sm:col-span-2">
          شعار الخلفية (PNG / JPG / WebP / SVG، الشفافية مدعومة)
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-neutral-200 bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] bg-[length:12px_12px]">
              {form.intro_logo ? <img src={form.intro_logo} alt="" className="h-full w-full object-contain" /> : <span className="text-[10px] text-neutral-400">لا شعار</span>}
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
            <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-bold hover:bg-neutral-100 disabled:opacity-60">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} رفع شعار
            </button>
            {form.intro_logo && <button type="button" disabled={busy} onClick={removeLogo} className="inline-flex items-center gap-1 text-sm font-bold text-red-600"><Trash2 size={15} /> حذف</button>}
          </div>
          {msg && <p className="mt-2 text-xs font-bold text-emerald-600">{msg}</p>}
          <label className="mt-4 block text-sm font-bold">شفافية الشعار: {cfg.opacity}%
            <input type="range" min={0} max={60} value={cfg.opacity} onChange={(e) => set("intro_logo_opacity", e.target.value)} className="mt-1 block w-full max-w-xs" />
          </label>
        </div>

        <label className="block text-sm font-bold">نص الزر (فارغ = إخفاء)<input className={inputCls} value={form.intro_cta_text ?? "تسوق الآن"} maxLength={30} onChange={(e) => set("intro_cta_text", e.target.value)} /></label>
        <label className="block text-sm font-bold">رابط الزر<input dir="ltr" className={`${inputCls} text-left`} value={form.intro_cta_link ?? "/products"} placeholder="/products" onChange={(e) => set("intro_cta_link", e.target.value)} /></label>
      </div>
    </div>
  );
}
