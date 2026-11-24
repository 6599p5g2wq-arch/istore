"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gift, Truck, Banknote, MapPin, User, Phone, StickyNote, Loader2, TicketPercent, CheckCircle2 } from "lucide-react";
import { useCart } from "./CartContext";
import { formatPrice, formatSecondary } from "@/lib/format";
import type { City } from "@/lib/types";

export default function CheckoutForm({ cities, currency, whatsapp, freeThreshold, customer, loyalty }: { cities: City[]; currency: string; whatsapp: string; freeThreshold: number; customer?: { name: string; phone: string; city: string; address: string; email?: string } | null; loyalty?: { points: number; redeemPoints: number; redeemValue: number } | null }) {
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({
    name: customer?.name || "", phone: customer?.phone || "", email: customer?.email || "",
    city: cities.find((c) => c.name === customer?.city)?.name || cities[0]?.name || "",
    address: customer?.address || "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const discount = applied?.discount ?? 0;
  const [usePoints, setUsePoints] = useState(false);
  const blocks = loyalty ? Math.max(0, Math.min(Math.floor(loyalty.points / loyalty.redeemPoints), Math.floor((total - discount) / loyalty.redeemValue))) : 0;
  const pointsDiscount = usePoints && loyalty ? blocks * loyalty.redeemValue : 0;
  const pointsUsed = usePoints && loyalty ? blocks * loyalty.redeemPoints : 0;
  const fee = useMemo(() => {
    if (freeThreshold > 0 && total - discount - pointsDiscount >= freeThreshold) return 0;
    return cities.find((c) => c.name === form.city)?.fee ?? 0;
  }, [form.city, cities, total, discount, pointsDiscount, freeThreshold]);

  // Abandoned-cart capture: once we have a valid phone + items, record the lead.
  useEffect(() => {
    if (!/^[\d+\s-]{8,}$/.test(form.phone.trim()) || items.length === 0) return;
    const t = setTimeout(() => {
      fetch("/api/cart-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone.trim(), items: items.map((i) => ({ name: i.variant_label ? `${i.name} — ${i.variant_label}` : i.name, qty: i.qty, price: i.price })), total }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [form.phone, items, total]);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true); setCouponError("");
    const r = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon.trim(), subtotal: total }),
    });
    setCouponLoading(false);
    const d = await r.json().catch(() => ({}));
    if (r.ok) setApplied({ code: coupon.trim().toUpperCase(), discount: d.discount });
    else { setApplied(null); setCouponError(d.error || "كود غير صالح"); }
  };

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
        body: JSON.stringify({ ...form, coupon: applied?.code || "", use_points: usePoints, items: items.map((i) => ({ id: i.id, qty: i.qty, variant_id: i.variant_id ?? null })) }),
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
      <div className="mt-10 grid place-items-center rounded-3xl bg-[var(--card)] py-20 text-center">
        <p className="text-lg font-bold text-[var(--text-dim)]">لا توجد منتجات في السلة</p>
        <Link href="/products" className="mt-5 rounded-full bg-white px-8 py-3 font-bold text-black">تسوق الآن</Link>
      </div>
    );
  }

  const inputCls = "w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-white outline-none transition placeholder:text-[var(--text-dim)] placeholder:opacity-90 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20";

  return (
    <form onSubmit={submit} className="mt-10 grid gap-10 lg:grid-cols-5">
      <div className="space-y-5 lg:col-span-3">
        <div className="rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-extrabold text-white"><User size={19} className="text-[var(--accent)]" /> بيانات المستلم</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-[var(--text)]">
              الاسم الكامل *
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`mt-1.5 ${inputCls}`} placeholder="مثال: محمد أحمد" />
            </label>
            <label className="block text-sm font-bold text-[var(--text)]">
              رقم الهاتف *
              <input required dir="ltr" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`mt-1.5 text-left ${inputCls}`} placeholder="09XXXXXXXX" />
            </label>
            <label className="block text-sm font-bold text-[var(--text)] sm:col-span-2">
              البريد الإلكتروني (اختياري — نرسل لك تأكيد الطلب وتحديثاته)
              <input dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`mt-1.5 text-left ${inputCls}`} placeholder="name@example.com" />
            </label>
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-extrabold text-white"><MapPin size={19} className="text-[var(--accent)]" /> عنوان التوصيل</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-[var(--text)]">
              المدينة *
              <select required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={`mt-1.5 ${inputCls}`}>
                {cities.map((c) => <option key={c.id} value={c.name}>{c.name} — توصيل {formatPrice(c.fee, currency)}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-[var(--text)]">
              العنوان بالتفصيل
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`mt-1.5 ${inputCls}`} placeholder="الحي، الشارع، أقرب معلم" />
            </label>
          </div>
          <label className="mt-4 block text-sm font-bold text-[var(--text)]">
            <span className="flex items-center gap-1.5"><StickyNote size={15} /> ملاحظات إضافية (اختياري)</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={`mt-1.5 resize-none ${inputCls}`} placeholder="أي تفاصيل تساعدنا في التوصيل" />
          </label>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-white"><TicketPercent size={19} className="text-[var(--accent)]" /> كود الخصم</h2>
          {applied ? (
            <p className="flex items-center justify-between rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400">
              <span className="flex items-center gap-2"><CheckCircle2 size={17} /> {applied.code} — خصم {formatPrice(applied.discount, currency)}</span>
              <button type="button" onClick={() => { setApplied(null); setCoupon(""); }} className="text-xs text-[var(--text-dim)] hover:text-[var(--text)]">إزالة</button>
            </p>
          ) : (
            <div>
              <div className="flex gap-2">
                <input dir="ltr" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="ISTORE10" className="flex-1 rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3 text-left text-white outline-none placeholder:text-[var(--text-dim)] placeholder:opacity-90 focus:border-[var(--accent)]" />
                <button type="button" onClick={applyCoupon} disabled={couponLoading} className="rounded-2xl bg-white px-6 py-3 text-sm font-bold text-black hover:bg-neutral-200 disabled:opacity-60">
                  {couponLoading ? <Loader2 size={16} className="animate-spin" /> : "تطبيق"}
                </button>
              </div>
              {couponError && <p className="mt-2 text-xs font-bold text-red-400">{couponError}</p>}
            </div>
          )}
        </div>
        {loyalty && loyalty.points > 0 && (
          <div className="rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-white"><Gift size={19} className="text-[var(--accent)]" /> نقاط الولاء</h2>
            <p className="text-sm text-[var(--text-dim)]">رصيدك: <b className="text-white">{loyalty.points}</b> نقطة ({loyalty.redeemPoints} نقطة = {formatPrice(loyalty.redeemValue, currency)})</p>
            <label className={`mt-3 flex items-center gap-3 text-sm font-bold ${blocks > 0 ? "text-white" : "text-[var(--text-faint)]"}`}>
              <input type="checkbox" disabled={blocks === 0} checked={usePoints && blocks > 0} onChange={(e) => setUsePoints(e.target.checked)} className="h-4 w-4" />
              {blocks > 0 ? `استخدم ${blocks * loyalty.redeemPoints} نقطة واحصل على خصم ${formatPrice(blocks * loyalty.redeemValue, currency)}` : "رصيدك لا يكفي للاستبدال بعد"}
            </label>
          </div>
        )}
        <div className="rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-white"><Banknote size={19} className="text-[var(--accent)]" /> طريقة الدفع</h2>
          <div className="flex items-center gap-3 rounded-2xl border-2 border-[var(--accent)] bg-[var(--accent)]/10 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--accent)] text-white"><Banknote size={20} /></span>
            <div>
              <p className="font-bold text-white">الدفع عند الاستلام</p>
              <p className="text-sm text-[var(--text-dim)]">ادفع نقداً عند وصول طلبك إليك</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-extrabold text-white">طلبك ({items.length})</h2>
          <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pl-1">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image} alt="" className="h-14 w-14 rounded-xl bg-[var(--surface-2)] object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold text-[var(--text)]">{it.name}</p>
                  {it.variant_label && <p className="text-xs font-bold text-[var(--text-faint)]">{it.variant_label}</p>}
                  <p className="text-xs text-[var(--text-faint)]">الكمية: {it.qty}</p>
                </div>
                <span className="text-sm font-bold text-white">{formatPrice(it.price * it.qty, currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-2.5 border-t border-[var(--border)] pt-4 text-sm">
            <div className="flex justify-between text-[var(--text-dim)]"><span>المجموع الفرعي</span><span className="font-bold text-white">{formatPrice(total, currency)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400"><span>الخصم ({applied?.code})</span><span className="font-bold">- {formatPrice(discount, currency)}</span></div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-emerald-400"><span>نقاط الولاء ({pointsUsed})</span><span className="font-bold">- {formatPrice(pointsDiscount, currency)}</span></div>
            )}
            <div className="flex justify-between text-[var(--text-dim)]">
              <span className="flex items-center gap-1"><Truck size={14} /> التوصيل — {form.city || "اختر المدينة"}</span>
              <span className={`font-bold ${fee === 0 ? "text-emerald-400" : "text-white"}`}>{fee === 0 ? "مجاني" : formatPrice(fee, currency)}</span>
            </div>
            {freeThreshold > 0 && total < freeThreshold && (
              <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-400">أضف منتجات بقيمة {formatPrice(freeThreshold - total, currency)} واحصل على شحن مجاني</p>
            )}
          </div>
          <div className="mt-4 flex justify-between border-t border-[var(--border)] pt-4">
            <span className="text-lg font-bold text-white">الإجمالي</span>
            <span className="text-2xl font-black text-[var(--accent)]">{formatPrice(total - discount - pointsDiscount + fee, currency)}</span>
          </div>
          {formatSecondary(total - discount - pointsDiscount + fee) && <p className="mt-1 text-left text-sm font-bold text-[var(--text-dim)]">{formatSecondary(total - discount - pointsDiscount + fee)}</p>}
          {error && <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">{error}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="glow-btn mt-6 flex w-full items-center justify-center gap-2 rounded-full py-4 text-lg font-bold transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Banknote size={20} />}
            {loading ? "جاري تأكيد الطلب…" : "تأكيد الطلب"}
          </motion.button>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="mt-3 block text-center text-sm font-bold text-emerald-400 hover:underline">
              أو اطلب مباشرة عبر واتساب
            </a>
          )}
        </div>
      </div>
    </form>
  );
}
