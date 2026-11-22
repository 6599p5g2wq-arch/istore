import React from "react";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice, formatDate } from "@/lib/format";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import DeleteButton from "@/components/admin/DeleteButton";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { new: "جديد", confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التوصيل", cancelled: "ملغي" };

export default function AdminOrders({ searchParams }: { searchParams: { status?: string } }) {
  const db = getDb();
  const s = getSettings();
  const st = searchParams.status || "";
  const orders = st
    ? db.prepare("SELECT * FROM orders WHERE status = ? ORDER BY id DESC").all(st) as Order[]
    : db.prepare("SELECT * FROM orders ORDER BY id DESC").all() as Order[];
  const counts = Object.fromEntries((db.prepare("SELECT status, COUNT(*) c FROM orders GROUP BY status").all() as { status: string; c: number }[]).map((r) => [r.status, r.c]));
  const total = Object.values(counts).reduce((a: number, b) => a + (b as number), 0);

  const tabs = [
    { key: "", label: `الكل (${total})` },
    { key: "new", label: `جديدة (${counts.new || 0})` },
    { key: "confirmed", label: `مؤكدة (${counts.confirmed || 0})` },
    { key: "shipped", label: `مشحونة (${counts.shipped || 0})` },
    { key: "delivered", label: `مكتملة (${counts.delivered || 0})` },
    { key: "cancelled", label: `ملغية (${counts.cancelled || 0})` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">الطلبات</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link key={t.key} href={t.key ? `/admin/orders?status=${t.key}` : "/admin/orders"}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${st === t.key ? "bg-black text-white" : "bg-white text-neutral-600 shadow-sm hover:bg-neutral-100"}`}>
            {t.label}
          </Link>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto rounded-3xl bg-white p-4 shadow-sm">
        {orders.length === 0 ? <p className="py-12 text-center text-sm text-neutral-400">لا توجد طلبات هنا</p> : (
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b text-right text-xs text-neutral-400">
                <th className="p-3 font-bold">رقم الطلب</th><th className="p-3 font-bold">العميل</th><th className="p-3 font-bold">الهاتف</th>
                <th className="p-3 font-bold">المدينة</th><th className="p-3 font-bold">الإجمالي</th><th className="p-3 font-bold">التاريخ</th>
                <th className="p-3 font-bold">الحالة</th><th className="p-3 font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60">
                  <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-extrabold text-[var(--accent)]" dir="ltr">{o.code}</Link></td>
                  <td className="p-3 font-bold">{o.customer_name}</td>
                  <td className="p-3 text-neutral-500" dir="ltr">{o.phone}</td>
                  <td className="p-3 text-neutral-500">{o.city}</td>
                  <td className="p-3 font-bold">{formatPrice(o.total, s.currency)}</td>
                  <td className="p-3 text-xs text-neutral-400">{formatDate(o.created_at)}</td>
                  <td className="p-3"><OrderStatusSelect id={o.id} status={o.status} labels={STATUS_LABEL} /></td>
                  <td className="p-3"><DeleteButton resource="orders" id={o.id} label={o.code} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
