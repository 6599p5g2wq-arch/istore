import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Phone, Package } from "lucide-react";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice, formatDate } from "@/lib/format";
import Reveal from "@/components/store/Reveal";
import type { Order, OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function OrderSuccessPage({ params }: { params: { code: string } }) {
  const db = getDb();
  const s = getSettings();
  const order = db.prepare("SELECT * FROM orders WHERE code = ?").get(params.code) as Order | undefined;
  if (!order) notFound();
  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id) as OrderItem[];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 sm:px-6">
      <Reveal className="text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={44} /></span>
        <h1 className="mt-6 text-3xl font-black sm:text-4xl">تم استلام طلبك بنجاح!</h1>
        <p className="mt-3 text-neutral-500">شكراً {order.customer_name}، سنتواصل معك قريباً على <b dir="ltr">{order.phone}</b> لتأكيد الطلب قبل الشحن.</p>
        <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-black px-8 py-3 text-white">
          <Package size={19} />
          <span className="font-bold">رقم الطلب:</span>
          <span className="font-extrabold tracking-wider" dir="ltr">{order.code}</span>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="mt-10 rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">تفاصيل الطلب</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {items.map((it) => (
              <li key={it.id} className="flex justify-between">
                <span>{it.name} <span className="text-neutral-400">× {it.qty}</span></span>
                <span className="font-bold">{formatPrice(it.price * it.qty, s.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
            <div className="flex justify-between text-neutral-500"><span>المجموع الفرعي</span><span className="font-bold text-black">{formatPrice(order.subtotal, s.currency)}</span></div>
            <div className="flex justify-between text-neutral-500"><span>التوصيل — {order.city}</span><span className="font-bold text-black">{order.delivery_fee === 0 ? "مجاني" : formatPrice(order.delivery_fee, s.currency)}</span></div>
            <div className="flex justify-between pt-1 text-lg"><span className="font-bold">الإجمالي</span><span className="font-black text-[var(--accent)]">{formatPrice(order.total, s.currency)}</span></div>
          </div>
          <p className="mt-4 text-xs text-neutral-400">{formatDate(order.created_at)} — الدفع عند الاستلام</p>
        </div>
      </Reveal>

      <Reveal delay={0.25} className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/track" className="rounded-full bg-[var(--accent)] px-8 py-3.5 font-bold text-white shadow-lg transition hover:opacity-90">تتبع طلبك</Link>
        <Link href="/products" className="rounded-full border border-neutral-200 px-8 py-3.5 font-bold transition hover:bg-neutral-50">متابعة التسوق</Link>
        {s.whatsapp && (
          <a href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(`مرحباً، أريد الاستفسار عن طلبي ${order.code}`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-3.5 font-bold text-white shadow-lg transition hover:opacity-90">
            <Phone size={17} /> تواصل واتساب
          </a>
        )}
      </Reveal>
    </div>
  );
}
