import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice, formatDate } from "@/lib/format";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import OrderNotes from "@/components/admin/OrderNotes";
import PrintButton from "@/components/admin/PrintButton";
import DeleteButton from "@/components/admin/DeleteButton";
import { Phone, MapPin, StickyNote, ArrowRight, History } from "lucide-react";
import type { Order, OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { new: "جديد", confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التوصيل", cancelled: "ملغي" };
const STATUS_DOT: Record<string, string> = {
  new: "bg-amber-400", confirmed: "bg-blue-500", shipped: "bg-purple-500", delivered: "bg-emerald-500", cancelled: "bg-red-500",
};

export default async function OrderDetail(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const db = getDb();
  const s = getSettings();
  // الرجوع يحافظ على حالة القائمة (فلتر الحالة) إن جاء المستخدم منها
  let backHref = "/admin/orders";
  try {
    const ref = (await headers()).get("referer") || "";
    const u = new URL(ref);
    if (u.pathname === "/admin/orders") backHref = u.pathname + u.search;
  } catch { /* لا مُحيل صالح */ }
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(params.id) as Order | undefined;
  if (!order) notFound();
  const items = db.prepare(
    "SELECT oi.*, p.image AS pimage FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?"
  ).all(order.id) as (OrderItem & { pimage: string | null })[];
  const timeline = db.prepare("SELECT status, created_at FROM order_status_log WHERE order_id = ? ORDER BY id ASC").all(order.id) as { status: string; created_at: string }[];

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
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #print-area, #print-area * { visibility: visible !important; }
        #print-area { position: absolute !important; inset-inline: 0; top: 0; padding: 24px; background: #fff; }
        .no-print { display: none !important; }
      }`}</style>

      <div className="no-print flex flex-wrap items-center gap-3">
        <Link href={backHref} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-3 font-bold text-neutral-700 shadow-sm transition hover:bg-neutral-100">
          <ArrowRight size={18} /> رجوع للطلبات
        </Link>
        <PrintButton />
        <DeleteButton resource="orders" id={order.id} label={order.code} redirectTo="/admin/orders" />
      </div>

      <div id="print-area">
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-black sm:text-3xl" dir="ltr">{order.code}</h1>
          <span className="no-print"><OrderStatusSelect id={order.id} status={order.status} labels={STATUS_LABEL} /></span>
        </div>
        <p className="mt-1 text-sm text-neutral-400">
          {formatDate(order.created_at)} · <span className="font-bold text-neutral-500">{STATUS_LABEL[order.status] || order.status}</span>
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-extrabold">العميل</h2>
            <p className="font-bold">{order.customer_name}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-neutral-500"><Phone size={15} /> <a dir="ltr" href={`tel:${order.phone}`} className="hover:text-[var(--accent)]">{order.phone}</a></p>
            <p className="mt-2 flex items-center gap-2 text-sm text-neutral-500"><MapPin size={15} /> {order.city}{order.address ? ` — ${order.address}` : ""}</p>
            {order.notes && <p className="mt-2 flex items-start gap-2 text-sm text-neutral-500"><StickyNote size={15} className="mt-0.5 shrink-0" /> {order.notes}</p>}
            <a href={waUrl} target="_blank" rel="noreferrer"
              className="no-print mt-4 inline-block rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white transition hover:opacity-90">مراسلة واتساب</a>
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
                  <td className="py-2.5">
                    <span className="flex items-center gap-3">
                      {it.pimage ? <img src={it.pimage} alt="" className="h-11 w-11 shrink-0 rounded-xl bg-neutral-100 object-cover" /> : null}
                      <span className="font-bold">{it.name}{it.variant_label ? <span className="block text-xs font-bold text-neutral-400">{it.variant_label}</span> : null}</span>
                    </span>
                  </td>
                  <td className="py-2.5 text-neutral-500">{formatPrice(it.price, s.currency)}</td>
                  <td className="py-2.5">{it.qty}</td>
                  <td className="py-2.5 font-bold">{formatPrice(it.price * it.qty, s.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="no-print mt-5 grid gap-5 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-extrabold"><History size={18} className="text-violet-500" /> سجل الحالات</h2>
          {timeline.length === 0 ? (
            <p className="text-sm text-neutral-400">لا سجل بعد</p>
          ) : (
            <ol className="relative space-y-4 border-r-2 border-neutral-100 pr-4">
              {timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -right-[23px] top-1 h-3 w-3 rounded-full border-2 border-white ${STATUS_DOT[t.status] || "bg-neutral-300"}`} />
                  <p className="text-sm font-bold">{STATUS_LABEL[t.status] || t.status}</p>
                  <p className="text-xs text-neutral-400">{formatDate(t.created_at)}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-extrabold"><StickyNote size={18} className="text-amber-500" /> ملاحظات داخلية</h2>
          <p className="mb-3 text-xs text-neutral-400">تظهر لك أنت فقط — العميل لا يراها</p>
          <OrderNotes id={order.id} initial={order.admin_notes || ""} />
        </div>
      </div>
    </div>
  );
}
