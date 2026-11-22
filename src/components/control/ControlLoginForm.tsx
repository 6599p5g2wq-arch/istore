"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

export default function ControlLoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/control/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error || "بيانات الدخول غير صحيحة"); return; }
    router.replace("/control");
    router.refresh();
  };

  const inputCls = "w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-4 focus:ring-black/5";

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-bold">
        اسم المستخدم
        <input dir="ltr" required autoFocus value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={`mt-1.5 text-left ${inputCls}`} />
      </label>
      <label className="block text-sm font-bold">
        كلمة المرور
        <input dir="ltr" required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`mt-1.5 text-left ${inputCls}`} />
      </label>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600">{error}</p>}
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-3.5 font-bold text-white transition hover:bg-neutral-800 disabled:opacity-60">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
        دخول
      </button>
    </form>
  );
}
