"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, KeyRound, User } from "lucide-react";
import DeleteButton from "./DeleteButton";

type Admin = { id: number; username: string; created_at: string };

export default function AdminsManager({ admins }: { admins: Admin[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [pw, setPw] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await fetch("/api/admin/admins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    if (r.ok) { setForm({ username: "", password: "" }); router.refresh(); } else {
      const d = await r.json().catch(() => ({}));
      alert(d.error || "حدث خطأ");
    }
  };

  const changePw = async (id: number) => {
    if (!pw[id] || pw[id].length < 6) { alert("كلمة المرور 6 أحرف على الأقل"); return; }
    const r = await fetch(`/api/admin/admins/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw[id] }) });
    if (r.ok) { setPw({ ...pw, [id]: "" }); alert("تم تغيير كلمة المرور"); } else {
      const d = await r.json().catch(() => ({}));
      alert(d.error || "حدث خطأ");
    }
  };

  const inputCls = "rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-black";

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {admins.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neutral-900 text-white"><User size={20} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold" dir="ltr">{a.username}</p>
              <p className="text-xs text-neutral-400">أنشئ {a.created_at}</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="password" dir="ltr" placeholder="كلمة مرور جديدة" value={pw[a.id] || ""} onChange={(e) => setPw({ ...pw, [a.id]: e.target.value })} className={`w-40 text-left ${inputCls}`} />
              <button onClick={() => changePw(a.id)} aria-label="تغيير كلمة المرور" className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white"><KeyRound size={16} /></button>
              <DeleteButton resource="admins" id={a.id} label={a.username} />
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={add} className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-8">
        <h2 className="font-extrabold">مشرف جديد</h2>
        <label className="block text-sm font-bold">اسم المستخدم *<input dir="ltr" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={`mt-1.5 w-full text-left ${inputCls}`} /></label>
        <label className="block text-sm font-bold">كلمة المرور *<input dir="ltr" required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`mt-1.5 w-full text-left ${inputCls}`} /></label>
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-3 font-bold text-white disabled:opacity-60">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} إضافة مشرف
        </button>
      </form>
    </div>
  );
}
