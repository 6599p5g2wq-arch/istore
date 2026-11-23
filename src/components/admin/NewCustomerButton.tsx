"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, MessageCircle, Copy, Check } from "lucide-react";

// إنشاء حساب زبون يدوياً بكلمة مرور مؤقتة تُرسل واتساب
export default function NewCustomerButton({ storeName }: { storeName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ name: string; phone: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => { setOpen(false); setForm({ name: "", phone: "", email: "" }); setError(""); setCreated(null); setCopied(false); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const r = await fetch("/api/admin/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setError(d.error || "حدث خطأ"); return; }
    setCreated({ name: form.name.trim(), phone: form.phone.trim(), password: d.password });
    router.refresh();
  };

  const waText = created ? `السلام عليكم ${created.name}، معك ${storeName}.\nأنشأنا لك حساباً في متجرنا.\nكلمة المرور المؤقتة: ${created.password}\nادخل بها ثم غيّرها من صفحة «حسابي».` : "";
  const inputCls = "mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-black";

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800">
        <Plus size={16} /> زبون جديد
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => !busy && reset()}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold">{created ? "تم إنشاء الحساب" : "زبون جديد"}</h2>
              <button onClick={reset} aria-label="إغلاق"><X size={18} /></button>
            </div>
            {created ? (
              <div className="mt-4">
                <p className="text-sm text-neutral-600">أرسل كلمة المرور المؤقتة للزبون — سيُطلب منه تغييرها عند أول دخول:</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <code dir="ltr" className="rounded-xl bg-neutral-100 px-4 py-2 text-lg font-extrabold tracking-wider">{created.password}</code>
                  <button onClick={() => { navigator.clipboard?.writeText(created.password); setCopied(true); }} aria-label="نسخ" className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 hover:bg-neutral-200">
                    {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  </button>
                </div>
                <a href={`https://wa.me/${created.phone.replace(/[^\d]/g, "").replace(/^0/, "218")}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 py-3 font-bold text-white">
                  <MessageCircle size={16} /> إرسالها عبر واتساب
                </a>
                <button onClick={reset} className="mt-2 w-full rounded-full bg-neutral-100 py-3 font-bold">إغلاق</button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-3">
                <label className="block text-sm font-bold">الاسم<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></label>
                <label className="block text-sm font-bold">الهاتف<input required dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09XXXXXXXX" className={`${inputCls} text-left`} /></label>
                <label className="block text-sm font-bold">البريد الإلكتروني<input required type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`${inputCls} text-left`} /></label>
                {error && <p className="text-sm font-bold text-red-600">{error}</p>}
                <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-3 font-bold text-white disabled:opacity-60">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} إنشاء بكلمة مرور مؤقتة
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
