import React from "react";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice, formatDate } from "@/lib/format";
import { ShoppingCart, Package, Banknote, Clock, AlertTriangle, ChevronLeft, Eye, Users, ShoppingBag } from "lucide-react";
import type { Order, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { new: "جديد", confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التوصيل", cancelled: "ملغي" };
const STATUS_CLS: Record<string, string> = {
  new: "bg-amber-100 text-amber-700", confirmed: "bg-blue-100 text-blue-700", shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const db = getDb();
  const s = getSettings();
  const cur = s.currency;

  const totals = {
    orders: (db.prepare("SELECT COUNT(*) c FROM orders").get() as { c: number }).c,
    newOrders: (db.prepare("SELECT COUNT(*) c FROM orders WHERE status = 'new'").get() as { c: number }).c,
    products: (db.prepare("SELECT COUNT(*) c FROM products").get() as { c: number }).c,
    revenue: (db.prepare("SELECT COALESCE(SUM(total),0) t FROM orders WHERE status != 'cancelled'").get() as { t: number }).t,
  };
  const recent = db.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 8").all() as Order[];
  const lowStock = db.prepare("SELECT id, name, stock FROM products WHERE active = 1 AND stock <= 5 ORDER BY stock ASC LIMIT 8").all() as Pick<Product, "id" | "name" | "stock">[];
  const viewsToday = (db.prepare("SELECT COUNT(*) c FROM page_views WHERE date(created_at) = date('now')").get() as { c: number }).c;
  const viewsWeek = (db.prepare("SELECT COUNT(*) c FROM page_views WHERE created_at >= datetime('now', '-7 days')").get() as { c: number }).c;
  const leadsCount = (db.prepare("SELECT COUNT(*) c FROM cart_leads WHERE reminded = 0").get() as { c: number }).c;
  const customersCount = (db.prepare("SELECT COUNT(*) c FROM customers").get() as { c: number }).c;
  const topPages = db.prepare("SELECT path, COUNT(*) c FROM page_views WHERE created_at >= datetime('now', '-7 days') GROUP BY path ORDER BY c DESC LIMIT 6").all() as { path: string; c: number }[];

  const days: { day: string; total: number; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const row = db.prepare(
      `SELECT COALESCE(SUM(total),0) t, COUNT(*) c FROM orders WHERE status != 'cancelled' AND date(created_at) = date('now', ?)`
    ).get(`-${i} days`) as { t: number; c: number };
    const label = new Date(Date.now() - i * 86400000).toLocaleDateString("ar-LY", { weekday: "short" });
    days.push({ day: label, total: row.t, count: row.c });
  }
  const maxDay = Math.max(1, ...days.map((d) => d.total));

  const cards = [
    { label: "إجمالي المبيعات", value: formatPrice(totals.revenue, cur), icon: Banknote, color: "bg-emerald-500" },
    { label: "الطلبات", value: totals.orders, icon: ShoppingCart, color: "bg-blue-500" },
    { label: "طلبات جديدة", value: totals.newOrders, icon: Clock, color: "bg-amber-500" },
    { label: "المنتجات", value: totals.products, icon: Package, color: "bg-purple-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">مرحباً بك 👋</h1>
      <p className="mt-1 text-neutral-500">نظرة سريعة على أداء متجرك</p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-3xl bg-white p-5 shadow-sm">
            <span className={`grid h-11 w-11 place-items-center rounded-2xl text-white ${c.color}`}><c.icon size={20} /></span>
            <p className="mt-4 text-2xl font-black">{c.value}</p>
            <p className="text-sm text-neutral-400">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500 text-white"><Eye size={20} /></span>
          <p className="mt-4 text-2xl font-black">{viewsToday}</p>
          <p className="text-sm text-neutral-400">زيارات اليوم ({viewsWeek} هذا الأسبوع)</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-500 text-white"><ShoppingBag size={20} /></span>
          <p className="mt-4 text-2xl font-black">{leadsCount}</p>
          <p className="text-sm text-neutral-400">سلات مهجورة بانتظار التذكير</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500 text-white"><Users size={20} /></span>
          <p className="mt-4 text-2xl font-black">{customersCount}</p>
          <p className="text-sm text-neutral-400">حسابات الزبائن</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-extrabold">أكثر الصفحات زيارة (7 أيام)</h2>
          {topPages.length === 0 ? <p className="text-xs text-neutral-400">لا بيانات بعد</p> : (
            <ul className="space-y-1 text-xs">
              {topPages.map((p) => <li key={p.path} className="flex justify-between gap-2"><span className="line-clamp-1 text-neutral-500" dir="ltr">{p.path}</span><b>{p.c}</b></li>)}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-3">
          <h2 className="mb-6 font-extrabold">مبيعات آخر 7 أيام</h2>
          <div className="flex h-44 items-end justify-between gap-3">
            {days.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-neutral-400">{d.total > 0 ? formatPrice(d.total, cur) : ""}</span>
                <div className="w-full max-w-10 rounded-t-xl bg-[var(--accent)]/90 transition-all" style={{ height: `${Math.max(3, (d.total / maxDay) * 100)}%` }} title={`${d.count} طلب`} />
                <span className="text-xs font-bold text-neutral-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-extrabold"><AlertTriangle size={18} className="text-amber-500" /> مخزون منخفض</h2>
          {lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">كل المنتجات بمخزون جيد 👍</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-xl bg-[#f5f5f7] px-4 py-2.5 text-sm">
                  <span className="line-clamp-1 font-bold">{p.name}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${p.stock === 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>{p.stock === 0 ? "نفد" : p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-extrabold">أحدث الطلبات</h2>
          <Link href="/admin/orders" className="flex items-center gap-1 text-sm font-bold text-[var(--accent)]">كل الطلبات <ChevronLeft size={15} /></Link>
        </div>
        {recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">لا توجد طلبات بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-right text-xs text-neutral-400">
                  <th className="pb-3 font-bold">رقم الطلب</th><th className="pb-3 font-bold">العميل</th><th className="pb-3 font-bold">المدينة</th>
                  <th className="pb-3 font-bold">الإجمالي</th><th className="pb-3 font-bold">الحالة</th><th className="pb-3 font-bold">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60">
                    <td className="py-3"><Link href={`/admin/orders/${o.id}`} className="font-extrabold text-[var(--accent)]" dir="ltr">{o.code}</Link></td>
                    <td className="py-3 font-bold">{o.customer_name}</td>
                    <td className="py-3 text-neutral-500">{o.city}</td>
                    <td className="py-3 font-bold">{formatPrice(o.total, cur)}</td>
                    <td className="py-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLS[o.status] || "bg-neutral-100"}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
                    <td className="py-3 text-xs text-neutral-400">{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
