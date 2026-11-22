"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle2 } from "lucide-react";

const SECTIONS: { title: string; fields: { key: string; label: string; area?: boolean; ltr?: boolean }[] }[] = [
  {
    title: "هوية المتجر",
    fields: [
      { key: "store_name", label: "اسم المتجر" },
      { key: "store_tagline", label: "الوصف المختصر", area: true },
      { key: "announcement", label: "شريط الإعلانات (أعلى الصفحة)" },
      { key: "currency", label: "العملة" },
      { key: "footer_text", label: "نص الحقوق أسفل الصفحة" },
    ],
  },
  {
    title: "التواصل",
    fields: [
      { key: "phone", label: "رقم الهاتف", ltr: true },
      { key: "whatsapp", label: "رقم واتساب (بالصيغة الدولية بدون +)", ltr: true },
      { key: "email", label: "البريد الإلكتروني", ltr: true },
      { key: "address", label: "العنوان" },
      { key: "working_hours", label: "أوقات العمل" },
    ],
  },
  {
    title: "روابط التواصل الاجتماعي",
    fields: [
      { key: "facebook", label: "فيسبوك", ltr: true },
      { key: "instagram", label: "انستغرام", ltr: true },
      { key: "tiktok", label: "تيك توك", ltr: true },
    ],
  },
  {
    title: "الشحن",
    fields: [{ key: "free_shipping_threshold", label: "حد الشحن المجاني (0 لتعطيله)", ltr: true }],
  },
  {
    title: "التتبع والتحليلات",
    fields: [
      { key: "site_url", label: "رابط المتجر العلني (للخريطة والإشعارات)", ltr: true },
      { key: "meta_pixel_id", label: "معرف بكسل فيسبوك (Meta Pixel ID)", ltr: true },
      { key: "tiktok_pixel_id", label: "معرف بكسل تيك توك (TikTok Pixel ID)", ltr: true },
      { key: "ga_id", label: "معرف قوقل أناليتكس (G-XXXX)", ltr: true },
    ],
  },
  {
    title: "صفحة من نحن",
    fields: [
      { key: "about_text", label: "نبذة عن المتجر", area: true },
      { key: "delivery_policy", label: "سياسة التوصيل", area: true },
      { key: "returns_policy", label: "سياسة الاستبدال والاسترجاع", area: true },
    ],
  },
];

export default function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setSaved(false);
    await fetch("/api/control/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false); setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  };

  const inputCls = "w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-4 focus:ring-black/5";

  return (
    <form onSubmit={save} className="mt-8 max-w-3xl space-y-6">
      {SECTIONS.map((sec) => (
        <div key={sec.title} className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-extrabold">{sec.title}</h2>
          <div className="space-y-4">
            {sec.fields.map((f) => (
              <label key={f.key} className="block text-sm font-bold">
                {f.label}
                {f.area ? (
                  <textarea rows={3} value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={`mt-1.5 resize-y ${inputCls}`} />
                ) : (
                  <input dir={f.ltr ? "ltr" : undefined} value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={`mt-1.5 ${f.ltr ? "text-left" : ""} ${inputCls}`} />
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button disabled={loading} className="flex items-center gap-2 rounded-full bg-black px-10 py-4 font-bold text-white shadow-lg transition hover:bg-neutral-800 disabled:opacity-60">
        {loading ? <Loader2 size={18} className="animate-spin" /> : saved ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Save size={18} />}
        {saved ? "تم الحفظ" : "حفظ الإعدادات"}
      </button>
    </form>
  );
}
