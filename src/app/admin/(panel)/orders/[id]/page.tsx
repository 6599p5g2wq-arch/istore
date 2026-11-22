import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice, formatDate } from "@/lib/format";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import { Phone, MapPin, StickyNote, ArrowRight } from "lucide-react";
import type { Order, OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { new: "جديد", confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التوصيل", cancelled: "ملغي" };

export default function OrderDetail({ params }: { params: { id: string } }) {
  const db = getDb();
  const s = getSettings();
  // الرجوع يحافظ على حالة القائمة (فلتر الحالة) إن جاء المستخدم منها
  let backHref = "/admin/orders";
  try {
    const ref = headers().get("referer") || "";
    const u = new URL(ref);
    if (u.pathname === "/admin/orders") backHref = u.pathname + u.search;
  } catch { /* لا مُحيل صالح */ }
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(params.id) as Order | undefined;
  if (!order) notFound();
  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id) as OrderItem[];

  // رسالة واتساب جاهزة للعميل: كود الطلب + حالته الحالية — قابلة للتعديل في واتساب قبل الإرسال
  const waPhone = order.phone.replace(/[^\d]/g, "").replace(/^0/, "218");
  const waText = [
    `السلام عليكم ${order.customer_name}، معك ${s.store_name || "آي ستور"}.`,
    `طلبك رقم ${order.code}`,
    `حالة الطلب: ${STATUS_LABEL[order.status] || order.status}`,
  ].join("\n");
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;

  return (
    <div className="max-w-3xl">
      <Link href={backHref} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-3 font-bold text-neutral-700 shadow-sm transition hover:bg-neutral-100">
        <ArrowRight size={18} /> رجوع للطلبات
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black sm:text-3xl" dir="ltr">{order.code}</h1>
        <OrderStatusSelect id={order.id} status={order.status} labels={STATUS_LABEL} />
      </div>
      <p className="mt-1 text-sm text-neutral-400">{formatDate(order.created_at)}</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-extrabold">العميل</h2>
          <p className="font-bold">{order.customer_name}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-neutral-500"><Phone size={15} /> <a dir="ltr" href={`tel:${order.phone}`} className="hover:text-[var(--accent)]">{order.phone}</a></p>
          <p className="mt-2 flex items-center gap-2 text-sm text-neutral-500"><MapPin size={15} /> {order.city}{order.address ? ` — ${order.address}` : ""}</p>
          {order.notes && <p className="mt-2 flex items-start gap-2 text-sm text-neutral-500"><StickyNote size={15} className="mt-0.5 shrink-0" /> {order.notes}</p>}
          <a href={waUrl} target="_blank" rel="noreferrer"
            className="mt-4 inline-block rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white transition hover:opacity-90">مراسلة واتساب</a>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-extrabold">الملخص المالي</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-neutral-500"><span>المنتجات</span><span className="font-bold text-black">{formatPrice(order.subtotal, s.currency)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-600"><span>الخصم{order.coupon_code ? ` (${order.coupon_code})` : ""}</span><span className="font-bold">- {formatPrice(order.discount, s.currency)}</span></div>}
            <div className="flex justify-between text-neutral-500"><span>التوصيل</span><span className="font-bold text-black">{order.delivery_fee === 0 ? "مجاني" : formatPrice(order.delivery_fee, s.currency)}</span></div>
            <div className="flex justify-between border-t pt-3 text-base"><span className="font-bold">الإجمالي</span><span className="font-black text-[var(--accent)]">{formatPrice(order.total, s.currency)}</span></div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-extrabold">المنتجات ({items.length})</h2>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-right text-xs text-neutral-400"><th className="pb-2 font-bold">المنتج</th><th className="pb-2 font-bold">السعر</th><th className="pb-2 font-bold">الكمية</th><th className="pb-2 font-bold">المجموع</th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-neutral-50 last:border-0">
                <td className="py-2.5 font-bold">{it.name}{it.variant_label ? <span className="block text-xs font-bold text-neutral-400">{it.variant_label}</span> : null}</td>
                <td className="py-2.5 text-neutral-500">{formatPrice(it.price, s.currency)}</td>
                <td className="py-2.5">{it.qty}</td>
                <td className="py-2.5 font-bold">{formatPrice(it.price * it.qty, s.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
