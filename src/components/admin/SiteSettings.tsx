"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { ANNOUNCE_DEFAULT, EFFECTS, type AnnounceConfig, type AnnounceEffect } from "@/lib/announcement";
import AnnouncementBar from "@/components/store/AnnouncementBar";

const inputCls = "mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-4 focus:ring-black/5";

function fmtLocal(v: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m) return "";
  const h = Number(m[4]);
  return `${m[3]}/${m[2]}/${m[1]}  ${String(h % 12 || 12).padStart(2, "0")}:${m[5]} ${h < 12 ? "ص" : "م"}`;
}

// حقل تاريخ ووقت يعمل على الجوال (iOS Safari يعرض الحقل الفارغ بلا ارتفاع ولا نص)
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="block min-w-0 text-sm font-bold">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        {value && <button type="button" onClick={() => onChange("")} className="text-xs font-bold text-red-600 hover:underline">مسح</button>}
      </div>
      <div className="relative mt-1.5">
        <input type="datetime-local" dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}
          className="adt-input block h-12 w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-3 text-left text-sm outline-none focus:border-black focus:ring-4 focus:ring-black/5" />
        <span className={`adt-ph pointer-events-none absolute inset-y-0 left-3 right-11 hidden items-center text-sm ${value ? "font-bold text-neutral-900" : "font-normal text-neutral-400"}`}>
          {fmtLocal(value) || "اضغط لاختيار التاريخ والوقت"}
        </span>
      </div>
      <p className="mt-1 text-[11px] font-normal text-neutral-400">{value ? "" : "الصيغة: يوم/شهر/سنة ووقت"}</p>
      <style>{`.adt-input{-webkit-appearance:none;appearance:none;min-height:3rem}@supports (-webkit-touch-callout:none){.adt-input{color:transparent}.adt-input:focus{color:inherit}.adt-ph{display:flex!important}.adt-input::-webkit-datetime-edit{opacity:0}.adt-input:focus::-webkit-datetime-edit{opacity:1}}`}</style>
    </div>
  );
}

type Vals = Record<"currency" | "currency_pos" | "currency_decimals" | "currency2_symbol" | "currency2_rate" | "free_shipping_threshold" | "maintenance_enabled" | "maintenance_message" | "store_name" | "store_tagline" | "footer_text" | "phone" | "whatsapp" | "email" | "telegram_chat_id", string>;

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="font-extrabold">{title}</h2>
      {desc && <p className="mt-1 text-xs text-neutral-500">{desc}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-emerald-500" : "bg-neutral-300"}`}>
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "right-0.5" : "right-[1.375rem]"}`} />
    </button>
  );
}

export default function SiteSettings({ values, telegramTokenSaved, announce }: { values: Vals; telegramTokenSaved: boolean; announce: AnnounceConfig }) {
  const [v, setV] = useState<Vals>(values);
  const [token, setToken] = useState("");
  const [tg, setTg] = useState<"idle" | "sending" | "ok" | "fail">("idle");
  const set = (k: keyof Vals, val: string) => setV((o) => ({ ...o, [k]: val }));
  const testTelegram = async () => {
    setTg("sending");
    const r = await fetch("/api/admin/telegram-test", { method: "POST" }).catch(() => null);
    setTg(r && r.ok ? "ok" : "fail");
  };
  const router = useRouter();
  const [ann, setAnn] = useState<AnnounceConfig>({ ...ANNOUNCE_DEFAULT, ...announce, messages: announce.messages.length ? announce.messages : [{ text: "", link: "" }] });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setSaved(false); setErr("");
    const body: Record<string, unknown> = { announce_config: { ...ann, messages: ann.messages.filter((m) => m.text.trim()) } };
    Object.assign(body, v);
    if (token.trim()) body.telegram_bot_token = token.trim();
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
          <Card title="هوية المتجر" desc="الاسم والوصف يظهران في الموقع والتذييل.">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <label className="block text-sm font-bold">اسم المتجر<input value={v.store_name} onChange={(e) => set("store_name", e.target.value)} required maxLength={80} className={inputCls} /></label>
              <label className="block text-sm font-bold">نص الحقوق أسفل الصفحة<input value={v.footer_text} onChange={(e) => set("footer_text", e.target.value)} maxLength={200} className={inputCls} /></label>
              <label className="block text-sm font-bold sm:col-span-2">الوصف المختصر<textarea value={v.store_tagline} onChange={(e) => set("store_tagline", e.target.value)} rows={2} maxLength={300} className={inputCls} /></label>
            </div>
          </Card>

          <Card title="التواصل" desc="أرقام وبريد التواصل الظاهرة للزبائن.">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <label className="block text-sm font-bold">رقم الهاتف<input dir="ltr" value={v.phone} onChange={(e) => set("phone", e.target.value)} className={`text-left ${inputCls}`} /></label>
              <label className="block text-sm font-bold">رقم واتساب (بالصيغة الدولية بدون +)<input dir="ltr" value={v.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} className={`text-left ${inputCls}`} /></label>
              <label className="block text-sm font-bold sm:col-span-2">البريد الإلكتروني<input dir="ltr" value={v.email} onChange={(e) => set("email", e.target.value)} className={`text-left ${inputCls}`} /></label>
            </div>
          </Card>

          <Card title="إشعارات الطلبات (تيليجرام)" desc="يصلك إشعار على تيليجرام عند كل طلب جديد.">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <label className="block text-sm font-bold">معرف المحادثة (Chat ID)<input dir="ltr" value={v.telegram_chat_id} onChange={(e) => set("telegram_chat_id", e.target.value)} className={`text-left ${inputCls}`} /></label>
              <label className="block text-sm font-bold">توكن البوت (Bot Token)
                <input dir="ltr" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder={telegramTokenSaved ? "محفوظ — اكتب توكن جديداً فقط لتغييره" : "الصق التوكن هنا"} className={`text-left ${inputCls}`} />
                <span className="mt-1 block text-[11px] font-normal text-neutral-400">لا يُعرض التوكن بعد حفظه أبداً. {telegramTokenSaved ? "حالياً: محفوظ." : "حالياً: غير محفوظ."}</span>
              </label>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button type="button" onClick={testTelegram} disabled={tg === "sending"} className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-bold hover:bg-neutral-50 disabled:opacity-60">{tg === "sending" ? "جارٍ الإرسال..." : "إرسال رسالة تجريبية"}</button>
              {tg === "ok" && <span className="text-xs font-bold text-emerald-600">وصلت الرسالة</span>}
              {tg === "fail" && <span className="text-xs font-bold text-red-600">فشل الإرسال (احفظ التوكن والمعرف أولاً ثم جرّب)</span>}
            </div>
          </Card>

          <Card title="العملة وعرض الأسعار" desc="تنطبق على صفحات المتجر.">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <label className="block text-sm font-bold">رمز العملة
                <input value={v.currency} onChange={(e) => set("currency", e.target.value)} maxLength={20} required className={inputCls} />
              </label>
              <label className="block text-sm font-bold">موضع الرمز
                <select value={v.currency_pos} onChange={(e) => set("currency_pos", e.target.value)} className={inputCls}>
                  <option value="after">بعد السعر (150 د.ل)</option>
                  <option value="before">قبل السعر (د.ل 150)</option>
                </select>
              </label>
              <label className="block text-sm font-bold">الكسور العشرية
                <select value={v.currency_decimals} onChange={(e) => set("currency_decimals", e.target.value)} className={inputCls}>
                  <option value="auto">تلقائي (بدون كسور للأعداد الصحيحة)</option>
                  <option value="0">بدون كسور دائماً (150)</option>
                  <option value="2">خانتان دائماً (150.00)</option>
                </select>
              </label>
            </div>
            <div className="mt-5 rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm font-bold">عملة ثانية للعرض (اختياري)</p>
              <p className="mt-1 text-xs text-neutral-500">تظهر بجانب السعر كقيمة تقريبية، مثل ≈ 28.85 $. للعرض فقط: الدفع والطلبات تبقى بالعملة الأساسية. اترك الحقلين فارغين لإيقافها.</p>
              <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <label className="block text-sm font-bold">رمز العملة الثانية<input value={v.currency2_symbol} onChange={(e) => set("currency2_symbol", e.target.value)} maxLength={10} placeholder="$" className={inputCls} /></label>
                <label className="block text-sm font-bold">سعر الصرف (كم {v.currency || "د.ل"} يساوي 1 {v.currency2_symbol || "من الثانية"})
                  <input dir="ltr" inputMode="decimal" value={v.currency2_rate} onChange={(e) => set("currency2_rate", e.target.value)} placeholder="5.2" className={`text-left ${inputCls}`} />
                </label>
              </div>
            </div>
          </Card>

          <Card title="الشحن" desc="الطلبات التي يتجاوز مجموعها هذا الحد يصير توصيلها مجاناً (تُضاف الرسالة التحفيزية في السلة تلقائياً).">
            <label className="block max-w-xs text-sm font-bold">حد الشحن المجاني ({v.currency || "د.ل"}) — 0 لتعطيله
              <input dir="ltr" inputMode="decimal" value={v.free_shipping_threshold} onChange={(e) => set("free_shipping_threshold", e.target.value)} className={`text-left ${inputCls}`} />
            </label>
          </Card>

          <Card title="وضع الصيانة" desc="عند التفعيل يرى الزوار رسالة الإغلاق بدل المتجر ولا يمكنهم إرسال طلبات. أنت (مسجّلاً في لوحة الإدارة) تتصفح المتجر عادياً.">
            <div className="flex items-center gap-3">
              <Switch on={v.maintenance_enabled === "1"} onChange={(on) => set("maintenance_enabled", on ? "1" : "0")} />
              <span className={`text-sm font-bold ${v.maintenance_enabled === "1" ? "text-amber-600" : "text-neutral-400"}`}>{v.maintenance_enabled === "1" ? "المتجر مغلق للزوار" : "المتجر مفتوح"}</span>
            </div>
            <label className="mt-4 block text-sm font-bold">رسالة الإغلاق
              <textarea value={v.maintenance_message} onChange={(e) => set("maintenance_message", e.target.value)} rows={2} maxLength={300} placeholder="المتجر مغلق مؤقتاً للصيانة، نعود قريباً." className={inputCls} />
            </label>
          </Card>

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

            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <label className="block text-sm font-bold">لون الخلفية
                <span className="mt-1.5 flex items-center gap-2"><input type="color" value={ann.bg} onChange={(e) => setAnn({ ...ann, bg: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border border-neutral-200 bg-white p-1" /><span dir="ltr" className="text-xs text-neutral-500">{ann.bg}</span></span>
              </label>
              <label className="block text-sm font-bold">لون النص
                <span className="mt-1.5 flex items-center gap-2"><input type="color" value={ann.color} onChange={(e) => setAnn({ ...ann, color: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border border-neutral-200 bg-white p-1" /><span dir="ltr" className="text-xs text-neutral-500">{ann.color}</span></span>
              </label>
              <label className="block text-sm font-bold">التبديل كل (ثانية)
                <input type="number" min={2} max={30} value={ann.interval} onChange={(e) => setAnn({ ...ann, interval: Number(e.target.value) || 5 })} className={inputCls} />
              </label>
              <label className="block text-sm font-bold">طريقة العرض
                <select value={ann.effect} onChange={(e) => setAnn({ ...ann, effect: e.target.value as AnnounceEffect })} className={inputCls}>
                  {EFFECTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {ann.effect === "marquee" && <span className="mt-1 block text-[11px] font-normal text-neutral-400">في الشريط المتحرك تظهر كل الرسائل متتابعة ولا يُستخدم "التبديل كل".</span>}
              </label>
              <DateField label="يبدأ في (اختياري)" value={ann.start} onChange={(v) => setAnn({ ...ann, start: v })} />
              <DateField label="ينتهي في (اختياري)" value={ann.end} onChange={(v) => setAnn({ ...ann, end: v })} />
            </div>
            <p className="mt-2 text-[11px] text-neutral-400">التوقيت بتوقيت ليبيا. يختفي الشريط تلقائياً خارج هذه الفترة.</p>

            <div className="mt-4 space-y-2.5 text-sm font-bold">
              <label className="flex items-center gap-2.5"><input type="checkbox" checked={ann.countdown} onChange={(e) => setAnn({ ...ann, countdown: e.target.checked })} className="h-4 w-4" /> عرض عدّاد تنازلي للزائر حتى تاريخ الانتهاء {!ann.end && <span className="text-[11px] font-normal text-amber-600">(حدد تاريخ الانتهاء أولاً)</span>}</label>
              <label className="flex items-center gap-2.5"><input type="checkbox" checked={ann.closable} onChange={(e) => setAnn({ ...ann, closable: e.target.checked })} className="h-4 w-4" /> السماح للزائر بإغلاق الشريط (زر X)</label>
            </div>

            <p className="mb-2 mt-6 text-xs font-bold text-neutral-400">معاينة</p>
            <AnnouncementBar key={ann.effect + ann.messages.length} preview sig="preview" config={{ ...ann, messages: ann.messages.filter((m) => m.text.trim()).length ? ann.messages.filter((m) => m.text.trim()) : [{ text: "نص الإعلان يظهر هنا", link: "" }] }} />
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
