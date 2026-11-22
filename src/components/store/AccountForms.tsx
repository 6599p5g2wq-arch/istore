"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, Mail, Phone, Lock } from "lucide-react";

export default function AccountForms() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
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
        <button onClick={() => setMode("login")} className={`rounded-full py-2.5 transition ${mode === "login" ? "bg-white text-black" : "text-[var(--text-dim)]"}`}>تسجيل الدخول</button>
        <button onClick={() => setMode("register")} className={`rounded-full py-2.5 transition ${mode === "register" ? "bg-white text-black" : "text-[var(--text-dim)]"}`}>حساب جديد</button>
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
              <input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`${inputCls} text-left`} placeholder="09XXXXXXXX" />
            </label>
          </>
        )}
        <label className="block text-sm font-bold text-[var(--text)]">
          <span className="mb-1.5 flex items-center gap-1.5"><Mail size={15} /> البريد الإلكتروني</span>
          <input required type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`${inputCls} text-left`} />
        </label>
        <label className="block text-sm font-bold text-[var(--text)]">
          <span className="mb-1.5 flex items-center gap-1.5"><Lock size={15} /> كلمة المرور</span>
          <input required type="password" dir="ltr" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`${inputCls} text-left`} />
        </label>
        {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">{error}</p>}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 font-bold text-black transition hover:bg-neutral-200 disabled:opacity-60">
          {loading && <Loader2 size={17} className="animate-spin" />}
          {mode === "login" ? "دخول" : "إنشاء الحساب"}
        </button>
      </form>
    </div>
  );
}
