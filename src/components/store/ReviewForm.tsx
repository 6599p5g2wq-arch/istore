"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, Loader2, BadgeCheck } from "lucide-react";

export default function ReviewForm({ productId, onDone }: { productId: number; onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", rating: 5, comment: "", phone: "", order_code: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const r = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, ...form }),
    });
    setLoading(false);
    if (r.ok) { setDone(true); onDone?.(); return; }
    const d = await r.json().catch(() => ({}));
    setError(d.error || "حدث خطأ، حاول مرة أخرى");
  };

  if (done) {
    return (
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400">
        <BadgeCheck size={17} /> شكراً! تم نشر تقييمك الموثق.
      </motion.p>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-full border border-[var(--border-strong)] px-6 py-2.5 text-sm font-bold text-[var(--text)] transition hover:bg-[var(--chip)]">
        اكتب تقييمك
      </button>
    );
  }

  const inputCls = "w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[var(--text-dim)] placeholder:opacity-90 focus:border-[var(--accent)]";

  return (
    <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })} aria-label={`${n} نجوم`}>
            <Star size={26} className={n <= form.rating ? "text-amber-400" : "text-[var(--text-faint)]"} fill="currentColor" />
          </button>
        ))}
      </div>
      <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسمك" className={inputCls} />
      <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={3} placeholder="رأيك في المنتج (اختياري)" className={`${inputCls} resize-none`} />
      <p className="text-xs text-[var(--text-faint)]">التوثيق: التقييم متاح فقط لمن استلم المنتج — أدخل رقم طلبك وهاتفك.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input required dir="ltr" value={form.order_code} onChange={(e) => setForm({ ...form, order_code: e.target.value })} placeholder="IST-XXXXXX" className={`${inputCls} text-left`} />
        <input required dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09XXXXXXXX" className={`${inputCls} text-left`} />
      </div>
      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400">{error}</p>}
      <button disabled={loading} className="flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold text-black transition hover:bg-neutral-200 disabled:opacity-60">
        {loading && <Loader2 size={15} className="animate-spin" />} نشر التقييم
      </button>
    </motion.form>
  );
}
