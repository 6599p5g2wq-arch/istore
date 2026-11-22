"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, Package, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/format";

const STATUS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  new: { label: "قيد المراجعة", icon: Clock, color: "text-amber-500 bg-amber-50" },
  confirmed: { label: "تم التأكيد", icon: CheckCircle2, color: "text-blue-500 bg-blue-50" },
  shipped: { label: "في الطريق إليك", icon: Truck, color: "text-purple-500 bg-purple-50" },
  delivered: { label: "تم التوصيل", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50" },
  cancelled: { label: "ملغي", icon: XCircle, color: "text-red-500 bg-red-50" },
};

type Result = { code: string; status: string; total: number; city: string; created_at: string; items: { name: string; qty: number }[] };

export default function TrackForm() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await fetch(`/api/track?code=${encodeURIComponent(code)}&phone=${encodeURIComponent(phone)}`);
      const d = await r.json();
      if (!r.ok) setError(d.error || "لم يتم العثور على الطلب");
      else setResult(d.order);
    } catch { setError("تعذر الاتصال بالخادم"); }
    setLoading(false);
  };

  const inputCls = "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10";

  return (
    <div className="mt-10">
      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
        <label className="block text-sm font-bold">
          رقم الطلب
          <input dir="ltr" required value={code} onChange={(e) => setCode(e.target.value)} className={`mt-1.5 text-left ${inputCls}`} placeholder="IST-XXXXXX" />
        </label>
        <label className="block text-sm font-bold">
          رقم الهاتف المستخدم في الطلب
          <input dir="ltr" required value={phone} onChange={(e) => setPhone(e.target.value)} className={`mt-1.5 text-left ${inputCls}`} placeholder="09XXXXXXXX" />
        </label>
        <motion.button whileTap={{ scale: 0.97 }} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-3.5 font-bold text-white transition hover:bg-neutral-800 disabled:opacity-60">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />} تتبع
        </motion.button>
      </form>
      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-600">{error}</p>}
      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
          {(() => {
            const st = STATUS[result.status] || STATUS.new;
            return (
              <div className={`flex items-center gap-3 rounded-2xl p-4 ${st.color}`}>
                <st.icon size={26} />
                <div>
                  <p className="font-extrabold">{st.label}</p>
                  <p className="text-xs opacity-70">آخر تحديث لحالة طلبك</p>
                </div>
                <span className="mr-auto font-extrabold" dir="ltr">{result.code}</span>
              </div>
            );
          })()}
          <ul className="mt-4 space-y-2 text-sm">
            {result.items.map((it, i) => (
              <li key={i} className="flex items-center gap-2"><Package size={14} className="text-neutral-300" /> {it.name} <span className="text-neutral-400">× {it.qty}</span></li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-neutral-100 pt-4 text-sm">
            <span className="text-neutral-500">{result.city} — {formatDate(result.created_at)}</span>
            <span className="font-extrabold">{formatPrice(result.total)}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
