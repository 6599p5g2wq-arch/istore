"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";

export default function AccountForms({ whatsapp = "" }: { whatsapp?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", identifier: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const r = await fetch(`/api/account/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (r.ok) { router.refresh(); return; }
    const d = await r.json().catch(() => ({}));
    setError(d.error || "حدث خطأ، حاول مرة أخرى");
    setLoading(false);
  };

  const inputCls = "w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-white outline-none transition placeholder:text-neutral-600 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20";

  return (
    <div className="mx-auto mt-10 max-w-md rounded-3xl border border-[var(--border)] bg-white/[0.04] p-7">
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-full bg-[var(--card)] p-1 text-sm font-bold">
        <button type="button" onClick={() => setMode("login")} className={`rounded-full py-2.5 transition ${mode === "login" ? "bg-white text-black" : "text-[var(--text-dim)]"}`}>تسجيل الدخول</button>
        <button type="button" onClick={() => setMode("register")} className={`rounded-full py-2.5 transition ${mode === "register" ? "bg-white text-black" : "text-[var(--text-dim)]"}`}>حساب جديد</button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        {mode === "register" && (
          <>
            <label className="block text-sm font-bold text-[var(--text)]">
              <span className="mb-1.5 flex items-center gap-1.5"><User size={15} /> الاسم الكامل</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </label>
            <label className="block text-sm font-bold text-[var(--text)]">
              <span className="mb-1.5 flex items-center gap-1.5"><Phone size={15} /> رقم الهاتف</span>
              <input required dir="ltr" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`${inputCls} text-left`} placeholder="09XXXXXXXX" />
            </label>
          </>
        )}
        {mode === "register" ? (
          <label className="block text-sm font-bold text-[var(--text)]">
            <span className="mb-1.5 flex items-center gap-1.5"><Mail size={15} /> البريد الإلكتروني</span>
            <input required type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`${inputCls} text-left`} />
          </label>
        ) : (
          <label className="block text-sm font-bold text-[var(--text)]">
            <span className="mb-1.5 flex items-center gap-1.5"><Mail size={15} /> البريد الإلكتروني أو رقم الهاتف</span>
            <input required dir="ltr" autoComplete="username" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} className={`${inputCls} text-left`} placeholder="name@mail.com أو 09XXXXXXXX" />
          </label>
        )}
        <label className="block text-sm font-bold text-[var(--text)]">
          <span className="mb-1.5 flex items-center gap-1.5"><Lock size={15} /> كلمة المرور</span>
          <span className="relative block">
            <input required type={show ? "text" : "password"} dir="ltr" minLength={mode === "register" ? 8 : undefined} autoComplete={mode === "register" ? "new-password" : "current-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`${inputCls} pl-12 text-left`} />
            <button type="button" onClick={() => setShow(!show)} aria-label="إظهار كلمة المرور" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-white">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </span>
          {mode === "register" && <span className="mt-1 block text-xs font-normal text-[var(--text-dim)]">8 أحرف على الأقل</span>}
        </label>
        {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">{error}</p>}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 font-bold text-black transition hover:bg-neutral-200 disabled:opacity-60">
          {loading && <Loader2 size={17} className="animate-spin" />}
          {mode === "login" ? "دخول" : "إنشاء الحساب"}
        </button>
        {mode === "login" && (
          <p className="text-center text-sm text-[var(--text-dim)]">
            نسيت كلمة المرور؟{" "}
            <a href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent("السلام عليكم، نسيت كلمة مرور حسابي في المتجر وأحتاج إعادة تعيينها.")}`} target="_blank" rel="noreferrer" className="font-bold text-[var(--accent)] hover:underline">تواصل معنا عبر واتساب</a>
          </p>
        )}
      </form>
    </div>
  );
}
