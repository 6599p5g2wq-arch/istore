"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Truck, Banknote, MapPin, User, Phone, StickyNote, Loader2 } from "lucide-react";
import { useCart } from "./CartContext";
import { formatPrice } from "@/lib/format";
import type { City } from "@/lib/types";

export default function CheckoutForm({ cities, currency, whatsapp, freeThreshold }: { cities: City[]; currency: string; whatsapp: string; freeThreshold: number }) {
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", city: cities[0]?.name || "", address: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fee = useMemo(() => {
    if (freeThreshold > 0 && total >= freeThreshold) return 0;
    return cities.find((c) => c.name === form.city)?.fee ?? 0;
  }, [form.city, cities, total, freeThreshold]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (items.length === 0) { setError("سلتك فارغة"); return; }
    if (!form.name.trim() || !form.phone.trim() || !form.city) { setError("يرجى تعبئة الاسم ورقم الهاتف والمدينة"); return; }
    if (!/^[\d+\s-]{8,}$/.test(form.phone.trim())) { setError("رقم الهاتف غير صحيح"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: items.map((i) => ({ id: i.id, qty: i.qty })) }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "حدث خطأ، حاول مرة أخرى"); setLoading(false); return; }
      clear();
      router.push(`/order-success/${d.code}`);
    } catch {
      setError("تعذر الاتصال بالخادم، حاول مرة أخرى");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mt-10 grid place-items-center rounded-3xl bg-[#f5f5f7] py-20 text-center">
        <p className="text-lg font-bold text-neutral-400">لا توجد منتجات في السلة</p>
        <Link href="/products" className="mt-5 rounded-full bg-black px-8 py-3 font-bold text-white">تسوق الآن</Link>
      </div>
    );
  }

  const inputCls = "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10";

  return (
    <form onSubmit={submit} className="mt-10 grid gap-10 lg:grid-cols-5">
      <div className="space-y-5 lg:col-span-3">
        <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-extrabold"><User size={19} className="text-[var(--accent)]" /> بيانات المستلم</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              الاسم الكامل *
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`mt-1.5 ${inputCls}`} placeholder="مثال: محمد أحمد" />
            </label>
            <label className="block text-sm font-bold">
              رقم الهاتف *
              <input required dir="ltr" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`mt-1.5 text-left ${inputCls}`} placeholder="09XXXXXXXX" />
            </label>
          </div>
        </div>
        <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-extrabold"><MapPin size={19} className="text-[var(--accent)]" /> عنوان التوصيل</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              المدينة *
              <select required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={`mt-1.5 ${inputCls}`}>
                {cities.map((c) => <option key={c.id} value={c.name}>{c.name} — توصيل {formatPrice(c.fee, currency)}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold">
              العنوان بالتفصيل
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`mt-1.5 ${inputCls}`} placeholder="الحي، الشارع، أقرب معلم" />
            </label>
          </div>
          <label className="mt-4 block text-sm font-bold">
            <span className="flex items-center gap-1.5"><StickyNote size={15} /> ملاحظات إضافية (اختياري)</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={`mt-1.5 resize-none ${inputCls}`} placeholder="أي تفاصيل تساعدنا في التوصيل" />
          </label>
        </div>
        <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold"><Banknote size={19} className="text-[var(--accent)]" /> طريقة الدفع</h2>
          <div className="flex items-center gap-3 rounded-2xl border-2 border-[var(--accent)] bg-[var(--accent)]/5 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--accent)] text-white"><Banknote size={20} /></span>
            <div>
              <p className="font-bold">الدفع عند الاستلام</p>
              <p className="text-sm text-neutral-500">ادفع نقداً عند وصول طلبك إليك</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-3xl border border-neutral-100 bg-[#f5f5f7] p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-extrabold">طلبك ({items.length})</h2>
          <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pl-1">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image} alt="" className="h-14 w-14 rounded-xl bg-white object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold">{it.name}</p>
                  <p className="text-xs text-neutral-400">الكمية: {it.qty}</p>
                </div>
                <span className="text-sm font-bold">{formatPrice(it.price * it.qty, currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-2.5 border-t border-neutral-200 pt-4 text-sm">
            <div className="flex justify-between text-neutral-500"><span>المجموع الفرعي</span><span className="font-bold text-black">{formatPrice(total, currency)}</span></div>
            <div className="flex justify-between text-neutral-500">
              <span className="flex items-center gap-1"><Truck size={14} /> التوصيل — {form.city || "اختر المدينة"}</span>
              <span className={`font-bold ${fee === 0 ? "text-emerald-600" : "text-black"}`}>{fee === 0 ? "مجاني" : formatPrice(fee, currency)}</span>
            </div>
            {freeThreshold > 0 && total < freeThreshold && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">أضف منتجات بقيمة {formatPrice(freeThreshold - total, currency)} واحصل على شحن مجاني</p>
            )}
          </div>
          <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4">
            <span className="text-lg font-bold">الإجمالي</span>
            <span className="text-2xl font-black text-[var(--accent)]">{formatPrice(total + fee, currency)}</span>
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-black py-4 text-lg font-bold text-white shadow-lg transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Banknote size={20} />}
            {loading ? "جاري تأكيد الطلب…" : "تأكيد الطلب"}
          </motion.button>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="mt-3 block text-center text-sm font-bold text-emerald-600 hover:underline">
              أو اطلب مباشرة عبر واتساب
            </a>
          )}
        </div>
      </div>
    </form>
  );
}
