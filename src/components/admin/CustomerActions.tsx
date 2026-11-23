"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ban, CheckCircle2, KeyRound, Trash2, Save, Copy } from "lucide-react";

type C = { id: number; name: string; email: string; phone: string; blocked: number };

export default function CustomerActions({ customer, waPhone, storeName }: { customer: C; waPhone: string; storeName: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: customer.name, email: customer.email, phone: customer.phone });
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [temp, setTemp] = useState("");

  const call = async (body: object, key: string) => {
    setBusy(key); setMsg(null);
    const r = await fetch(`/api/admin/customers/${customer.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (!r.ok) { setMsg({ ok: false, text: d.error || "حدث خطأ" }); return null; }
    return d;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await call(form, "save")) { setMsg({ ok: true, text: "تم حفظ البيانات" }); router.refresh(); }
  };
  const toggleBlock = async () => {
    const block = !customer.blocked;
    if (block && !confirm("إيقاف هذا الحساب؟ سيُسجَّل خروجه ولن يستطيع الدخول.")) return;
    if (await call({ action: block ? "block" : "unblock" }, "block")) router.refresh();
  };
  const reset = async () => {
    if (!confirm("إنشاء كلمة مرور مؤقتة؟ ستنتهي كلمة مروره الحالية ويُسجَّل خروجه.")) return;
    const d = await call({ action: "reset" }, "reset");
    if (d) setTemp(d.password);
  };
  const del = async () => {
    if (!confirm(`حذف حساب «${customer.name}» نهائياً؟ تبقى طلباته محفوظة بدون ربط بالحساب.`)) return;
    setBusy("del");
    const r = await fetch(`/api/admin/customers/${customer.id}`, { method: "DELETE" });
    if (r.ok) router.push("/admin/customers"); else { setBusy(""); setMsg({ ok: false, text: "تعذر الحذف" }); }
  };

  const waText = `السلام عليكم ${customer.name}، معك ${storeName}.\nكلمة المرور المؤقتة لحسابك: ${temp}\nادخل بها ثم غيّرها من صفحة «حسابي».`;
  const inputCls = "mt-1.5 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-black";

  return (
    <div className="space-y-5">
      <form onSubmit={save} className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-extrabold">تعديل البيانات</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">الاسم<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></label>
          <label className="text-sm font-bold">الهاتف<input required dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`${inputCls} text-left`} /></label>
          <label className="text-sm font-bold sm:col-span-2">البريد<input required type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`${inputCls} text-left`} /></label>
        </div>
        <button disabled={!!busy} className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {busy === "save" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} حفظ
        </button>
      </form>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-extrabold">إجراءات الحساب</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={reset} disabled={!!busy} className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60">
            {busy === "reset" ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} إعادة تعيين كلمة المرور
          </button>
          <button onClick={toggleBlock} disabled={!!busy} className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold disabled:opacity-60 ${customer.blocked ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50" : "border-amber-300 text-amber-700 hover:bg-amber-50"}`}>
            {customer.blocked ? <><CheckCircle2 size={15} /> إلغاء الإيقاف</> : <><Ban size={15} /> إيقاف الحساب</>}
          </button>
          <button onClick={del} disabled={!!busy} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60">
            <Trash2 size={15} /> حذف الحساب
          </button>
        </div>
        {temp && (
          <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-800">كلمة المرور المؤقتة (تظهر مرة واحدة):</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <code dir="ltr" className="rounded-xl bg-white px-4 py-2 text-lg font-extrabold tracking-wider">{temp}</code>
              <button onClick={() => navigator.clipboard?.writeText(temp)} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 px-4 py-2 text-sm font-bold text-emerald-800"><Copy size={14} /> نسخ</button>
              <a href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer" className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white">إرسالها عبر واتساب</a>
            </div>
          </div>
        )}
        {msg && <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
