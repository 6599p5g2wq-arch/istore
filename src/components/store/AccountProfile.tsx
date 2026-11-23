"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, KeyRound, Check } from "lucide-react";
import type { Customer } from "@/lib/types";

const inputCls = "w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20";

export function ProfileForm({ customer, cities }: { customer: Customer; cities: string[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: customer.name, email: customer.email, phone: customer.phone, city: customer.city, address: customer.address });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMsg(null);
    const r = await fetch("/api/account/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json().catch(() => ({}));
    setLoading(false);
    if (r.ok) { setMsg({ ok: true, text: "تم حفظ بياناتك" }); router.refresh(); } else setMsg({ ok: false, text: d.error || "تعذر الحفظ" });
  };
  return (
    <form onSubmit={save} className="mt-6 grid gap-4 rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6 sm:grid-cols-2">
      <label className="text-sm font-bold">الاسم<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`mt-1.5 ${inputCls}`} /></label>
      <label className="text-sm font-bold">رقم الهاتف<input required dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`mt-1.5 text-left ${inputCls}`} /></label>
      <label className="text-sm font-bold sm:col-span-2">البريد الإلكتروني<input required type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`mt-1.5 text-left ${inputCls}`} /></label>
      <label className="text-sm font-bold">المدينة (للتوصيل)
        <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={`mt-1.5 ${inputCls}`}>
          <option value="">— اختر —</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold">العنوان<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`mt-1.5 ${inputCls}`} placeholder="الحي، الشارع، أقرب معلم" /></label>
      {msg && <p className={`rounded-xl px-4 py-3 text-sm font-bold sm:col-span-2 ${msg.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{msg.text}</p>}
      <button disabled={loading} className="flex items-center justify-center gap-2 rounded-full bg-white py-3 font-bold text-black transition hover:bg-neutral-200 disabled:opacity-60 sm:col-span-2">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />} حفظ التعديلات
      </button>
    </form>
  );
}

export function PasswordForm({ mustChange }: { mustChange: boolean }) {
  const [form, setForm] = useState({ current: "", next: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMsg(null);
    const r = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json().catch(() => ({}));
    setLoading(false);
    if (r.ok) { setMsg({ ok: true, text: "تم تغيير كلمة المرور" }); setForm({ current: "", next: "" }); } else setMsg({ ok: false, text: d.error || "تعذر التغيير" });
  };
  return (
    <form onSubmit={save} className="mt-6 grid gap-4 rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6 sm:grid-cols-2">
      {mustChange && <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-400 sm:col-span-2">دخلت بكلمة مرور مؤقتة من الإدارة. غيّرها الآن إلى كلمة مرور خاصة بك.</p>}
      <label className="text-sm font-bold">كلمة المرور الحالية<input required type="password" dir="ltr" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} className={`mt-1.5 text-left ${inputCls}`} /></label>
      <label className="text-sm font-bold">كلمة المرور الجديدة (8 أحرف على الأقل)<input required minLength={8} type="password" dir="ltr" autoComplete="new-password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} className={`mt-1.5 text-left ${inputCls}`} /></label>
      {msg && <p className={`rounded-xl px-4 py-3 text-sm font-bold sm:col-span-2 ${msg.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{msg.text}</p>}
      <button disabled={loading} className="flex items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] py-3 font-bold text-white transition hover:bg-[var(--chip)] disabled:opacity-60 sm:col-span-2">
        {loading ? <Loader2 size={16} className="animate-spin" /> : msg?.ok ? <Check size={16} /> : <KeyRound size={16} />} تغيير كلمة المرور
      </button>
    </form>
  );
}
