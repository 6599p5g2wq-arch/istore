"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { ANNOUNCE_DEFAULT, type AnnounceConfig } from "@/lib/announcement";

const inputCls = "mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-4 focus:ring-black/5";

export default function SiteSettings({ currency, announce }: { currency: string; announce: AnnounceConfig }) {
  const router = useRouter();
  const [cur, setCur] = useState(currency);
  const [ann, setAnn] = useState<AnnounceConfig>({ ...ANNOUNCE_DEFAULT, ...announce, messages: announce.messages.length ? announce.messages : [{ text: "", link: "" }] });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setSaved(false); setErr("");
    const body: Record<string, unknown> = { announce_config: { ...ann, messages: ann.messages.filter((m) => m.text.trim()) } };
    body.currency = cur;
    const r = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setLoading(false);
    if (r.ok) { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 2500); }
    else { const d = await r.json().catch(() => ({})); setErr(d.error || "حدث خطأ أثناء الحفظ"); }
  };

  const setMsg = (i: number, patch: Partial<{ text: string; link: string }>) =>
    setAnn({ ...ann, messages: ann.messages.map((m, j) => (j === i ? { ...m, ...patch } : m)) });

  const previewMsg = ann.messages.find((m) => m.text.trim())?.text || "نص الإعلان يظهر هنا";

  return (
    <form onSubmit={save} className="mt-6 space-y-5">
      {(
        <>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="font-extrabold">العملة</h2>
            <p className="mb-4 mt-1 text-xs text-neutral-500">تظهر بجانب كل الأسعار في المتجر.</p>
            <label className="block text-sm font-bold">رمز العملة
              <input value={cur} onChange={(e) => setCur(e.target.value)} maxLength={20} required className={`max-w-xs ${inputCls}`} />
              <span className="mt-1 block text-[11px] font-normal text-neutral-400">مثال: د.ل</span>
            </label>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-extrabold">شريط الإعلانات</h2>
                <p className="mt-1 text-xs text-neutral-500">يظهر أعلى كل صفحات المتجر. عند وجود أكثر من رسالة تتبدل تلقائياً.</p>
              </div>
              <button type="button" role="switch" aria-checked={ann.enabled} onClick={() => setAnn({ ...ann, enabled: !ann.enabled })} className={`relative h-7 w-12 shrink-0 rounded-full transition ${ann.enabled ? "bg-emerald-500" : "bg-neutral-300"}`}>
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${ann.enabled ? "right-0.5" : "right-[1.375rem]"}`} />
              </button>
            </div>
            <p className={`mt-2 text-xs font-bold ${ann.enabled ? "text-emerald-600" : "text-neutral-400"}`}>{ann.enabled ? "مفعّل" : "متوقف (لن يظهر للزبائن)"}</p>

            <div className="mt-5 space-y-3">
              {ann.messages.map((m, i) => (
                <div key={i} className="rounded-2xl bg-neutral-50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-black text-[11px] font-extrabold text-white">{i + 1}</span>
                    <input value={m.text} onChange={(e) => setMsg(i, { text: e.target.value })} maxLength={200} placeholder="نص الرسالة" className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-black" />
                    <button type="button" aria-label="حذف الرسالة" disabled={ann.messages.length === 1} onClick={() => setAnn({ ...ann, messages: ann.messages.filter((_, j) => j !== i) })} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"><Trash2 size={16} /></button>
                  </div>
                  <input dir="ltr" value={m.link} onChange={(e) => setMsg(i, { link: e.target.value })} placeholder="رابط عند الضغط (اختياري): /products أو https://..." className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-xs outline-none focus:border-black" />
                </div>
              ))}
              {ann.messages.length < 10 && (
                <button type="button" onClick={() => setAnn({ ...ann, messages: [...ann.messages, { text: "", link: "" }] })} className="flex items-center gap-1.5 rounded-full border border-dashed border-neutral-300 px-4 py-2 text-sm font-bold text-neutral-600 transition hover:bg-neutral-50"><Plus size={15} /> إضافة رسالة</button>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold">لون الخلفية
                <span className="mt-1.5 flex items-center gap-2"><input type="color" value={ann.bg} onChange={(e) => setAnn({ ...ann, bg: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border border-neutral-200 bg-white p-1" /><span dir="ltr" className="text-xs text-neutral-500">{ann.bg}</span></span>
              </label>
              <label className="block text-sm font-bold">لون النص
                <span className="mt-1.5 flex items-center gap-2"><input type="color" value={ann.color} onChange={(e) => setAnn({ ...ann, color: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border border-neutral-200 bg-white p-1" /><span dir="ltr" className="text-xs text-neutral-500">{ann.color}</span></span>
              </label>
              <label className="block text-sm font-bold">التبديل كل (ثانية)
                <input type="number" min={2} max={30} value={ann.interval} onChange={(e) => setAnn({ ...ann, interval: Number(e.target.value) || 5 })} className={inputCls} />
              </label>
              <span />
              <label className="block text-sm font-bold">يبدأ في (اختياري)
                <input type="datetime-local" dir="ltr" value={ann.start} onChange={(e) => setAnn({ ...ann, start: e.target.value })} className={`text-left ${inputCls}`} />
              </label>
              <label className="block text-sm font-bold">ينتهي في (اختياري)
                <input type="datetime-local" dir="ltr" value={ann.end} onChange={(e) => setAnn({ ...ann, end: e.target.value })} className={`text-left ${inputCls}`} />
              </label>
            </div>
            <p className="mt-2 text-[11px] text-neutral-400">التوقيت بتوقيت ليبيا. يختفي الشريط تلقائياً خارج هذه الفترة.</p>

            <div className="mt-4 space-y-2.5 text-sm font-bold">
              <label className="flex items-center gap-2.5"><input type="checkbox" checked={ann.countdown} onChange={(e) => setAnn({ ...ann, countdown: e.target.checked })} className="h-4 w-4" /> عدّاد تنازلي حتى تاريخ الانتهاء {!ann.end && <span className="text-[11px] font-normal text-amber-600">(حدد تاريخ الانتهاء أولاً)</span>}</label>
              <label className="flex items-center gap-2.5"><input type="checkbox" checked={ann.closable} onChange={(e) => setAnn({ ...ann, closable: e.target.checked })} className="h-4 w-4" /> السماح للزائر بإغلاق الشريط (زر X)</label>
            </div>

            <p className="mb-2 mt-6 text-xs font-bold text-neutral-400">معاينة</p>
            <div style={{ background: ann.bg, color: ann.color }} className="relative rounded-2xl px-10 py-2.5 text-center text-xs font-bold sm:text-sm">
              {previewMsg}
              {ann.countdown && ann.end && <span dir="rtl" className="mr-3 rounded-full px-2.5 py-0.5 text-xs" style={{ background: "rgba(255,255,255,0.18)" }}>2 يوم 03:25:10</span>}
              {ann.closable && <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-80">✕</span>}
            </div>
          </div>
        </>
      )}

      {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{err}</p>}
      <button disabled={loading} className="flex items-center gap-2 rounded-full bg-black px-10 py-4 font-bold text-white shadow-lg transition hover:bg-neutral-800 disabled:opacity-60">
        {loading ? <Loader2 size={18} className="animate-spin" /> : saved ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Save size={18} />}
        {saved ? "تم الحفظ" : "حفظ الإعدادات"}
      </button>
    </form>
  );
}
