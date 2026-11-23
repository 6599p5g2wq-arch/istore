"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle2 } from "lucide-react";

const SECTIONS: { title: string; fields: { key: string; label: string; area?: boolean; ltr?: boolean; toggle?: boolean }[] }[] = [
  {
    title: "هوية المتجر",
    fields: [
      { key: "store_name", label: "اسم المتجر" },
      { key: "store_tagline", label: "الوصف المختصر", area: true },
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
    title: "التتبع والتحليلات",
    fields: [
      { key: "site_url", label: "رابط المتجر العلني (للخريطة والإشعارات)", ltr: true },
      { key: "meta_pixel_id", label: "معرف بكسل فيسبوك (Meta Pixel ID)", ltr: true },
      { key: "tiktok_pixel_id", label: "معرف بكسل تيك توك (TikTok Pixel ID)", ltr: true },
      { key: "ga_id", label: "معرف قوقل أناليتكس (G-XXXX)", ltr: true },
    ],
  },
  {
    title: "إشعارات الطلبات (تيليجرام)",
    fields: [
      { key: "telegram_chat_id", label: "معرف المحادثة (Chat ID)", ltr: true },
      { key: "telegram_bot_token", label: "توكن البوت (Bot Token)", ltr: true },
    ],
  },
  {
    title: "وضع الصيانة",
    fields: [
      { key: "maintenance_enabled", label: "إغلاق المتجر للزوار (يرون رسالة الإغلاق ولا يستطيعون الطلب، والمشرف المسجّل في /admin يتصفح عادياً)", toggle: true },
      { key: "maintenance_message", label: "رسالة الإغلاق", area: true },
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

export default function SettingsForm({ settings, telegramTokenSaved = false }: { settings: Record<string, string>; telegramTokenSaved?: boolean }) {
  const router = useRouter();
  // التوكن لا يُعرض أبداً بعد حفظه: يبدأ الحقل فارغاً ويُحدَّث فقط إن كُتبت قيمة جديدة
  const [form, setForm] = useState<Record<string, string>>({ ...settings, telegram_bot_token: "" });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testState, setTestState] = useState<"idle" | "sending" | "ok" | "fail">("idle");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setSaved(false);
    // يُرسل فقط ما تعرضه هذه الصفحة، كي لا تُكتب فوق إعدادات صفحة «الإعدادات» في لوحة الإدارة
    const body: Record<string, string> = {};
    for (const sec of SECTIONS) for (const fl of sec.fields) body[fl.key] = form[fl.key] || "";
    if (!body.telegram_bot_token) delete body.telegram_bot_token;
    await fetch("/api/control/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setLoading(false); setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  };

  const testTelegram = async () => {
    setTestState("sending");
    try {
      const r = await fetch("/api/control/telegram-test", { method: "POST" });
      setTestState(r.ok ? "ok" : "fail");
    } catch {
      setTestState("fail");
    }
    setTimeout(() => setTestState("idle"), 4000);
  };

  const inputCls = "w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-4 focus:ring-black/5";

  return (
    <form onSubmit={save} className="mt-8 max-w-3xl space-y-6">
      {SECTIONS.map((sec) => (
        <div key={sec.title} className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-extrabold">{sec.title}</h2>
          <div className="space-y-4">
            {sec.fields.map((f) => f.toggle ? (
              <label key={f.key} className="flex items-start gap-3 text-sm font-bold">
                <input type="checkbox" checked={form[f.key] === "1"} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked ? "1" : "0" })} className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{f.label}{form[f.key] === "1" && <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">المتجر مغلق الآن</span>}</span>
              </label>
            ) : (
              <label key={f.key} className="block text-sm font-bold">
                {f.label}
                {f.area ? (
                  <textarea rows={3} value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={`mt-1.5 resize-y ${inputCls}`} />
                ) : (
                  <input
                    dir={f.ltr ? "ltr" : undefined}
                    type={f.key === "telegram_bot_token" ? "password" : "text"}
                    autoComplete="off"
                    value={form[f.key] || ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.key === "telegram_bot_token" ? (telegramTokenSaved ? "محفوظ — اتركه فارغاً للإبقاء عليه" : "من @BotFather") : undefined}
                    className={`mt-1.5 ${f.ltr ? "text-left" : ""} ${inputCls}`}
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={testTelegram} disabled={testState === "sending"} className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-bold text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-60">
          {testState === "sending" ? "جارٍ الإرسال..." : testState === "ok" ? "وصلت الرسالة التجريبية ✓" : testState === "fail" ? "فشل الإرسال — راجع التوكن والمعرف" : "إرسال رسالة تجريبية عبر تيليجرام"}
        </button>
      </div>
      <button disabled={loading} className="flex items-center gap-2 rounded-full bg-black px-10 py-4 font-bold text-white shadow-lg transition hover:bg-neutral-800 disabled:opacity-60">
        {loading ? <Loader2 size={18} className="animate-spin" /> : saved ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Save size={18} />}
        {saved ? "تم الحفظ" : "حفظ الإعدادات"}
      </button>
    </form>
  );
}
