import React from "react";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice, formatDate } from "@/lib/format";
import { ShoppingCart, Package, Banknote, Clock, AlertTriangle, ChevronLeft, Eye, Users, ShoppingBag, TrendingUp, Trophy, PieChart, type LucideIcon } from "lucide-react";
import type { Order, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { new: "جديد", confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التوصيل", cancelled: "ملغي" };
const STATUS_CLS: Record<string, string> = {
  new: "bg-amber-100 text-amber-700", confirmed: "bg-blue-100 text-blue-700", shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-700",
};
const STATUS_BAR: Record<string, string> = {
  new: "bg-amber-400", confirmed: "bg-blue-500", shipped: "bg-purple-500", delivered: "bg-emerald-500", cancelled: "bg-red-500",
};
const STATUS_ORDER = ["new", "confirmed", "shipped", "delivered", "cancelled"];

function Delta({ now, prev, label }: { now: number; prev: number; label: string }) {
  if (prev <= 0) {
    return <p className="mt-1 text-[11px] font-bold text-neutral-400">{now > 0 ? `▲ ${label}: 0` : "—"}</p>;
  }
  const pct = Math.round(((now - prev) / prev) * 100);
  const up = pct >= 0;
  return (
    <p className={`mt-1 text-[11px] font-extrabold ${up ? "text-emerald-600" : "text-red-500"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}% <span className="font-bold text-neutral-400">{label}</span>
    </p>
  );
}

function StatCard({ href, icon: Icon, color, value, label, delta, hint }: {
  href?: string; icon: LucideIcon; color: string;
  value: React.ReactNode; label: string; delta?: React.ReactNode; hint?: string;
}) {
  const inner = (
    <>
      <span className={`grid h-11 w-11 place-items-center rounded-2xl text-white ${color}`}><Icon size={20} /></span>
      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="text-sm text-neutral-400">{label}</p>
      {delta}
      {hint ? <p className="mt-1 text-[11px] font-bold text-[var(--accent)]">{hint}</p> : null}
    </>
  );
  const cls = "block rounded-3xl bg-white p-5 shadow-sm";
  if (href) return <Link href={href} className={`${cls} transition hover:-translate-y-0.5 hover:shadow-md`}>{inner}</Link>;
  return <div className={cls}>{inner}</div>;
}

export default async function AdminDashboard(props: { searchParams: Promise<{ range?: string }> }) {
  const searchParams = await props.searchParams;
  const db = getDb();
  const s = getSettings();
  const cur = s.currency;
  const range = searchParams?.range === "30" ? 30 : 7;

  const totals = {
    orders: (db.prepare("SELECT COUNT(*) c FROM orders").get() as { c: number }).c,
    newOrders: (db.prepare("SELECT COUNT(*) c FROM orders WHERE status = 'new'").get() as { c: number }).c,
    products: (db.prepare("SELECT COUNT(*) c FROM products").get() as { c: number }).c,
    revenue: (db.prepare("SELECT COALESCE(SUM(total),0) t FROM orders WHERE status != 'cancelled'").get() as { t: number }).t,
  };
  const today = db.prepare("SELECT COALESCE(SUM(total),0) t, COUNT(*) c FROM orders WHERE status != 'cancelled' AND date(created_at) = date('now')").get() as { t: number; c: number };
  const yesterday = db.prepare("SELECT COALESCE(SUM(total),0) t, COUNT(*) c FROM orders WHERE status != 'cancelled' AND date(created_at) = date('now', '-1 day')").get() as { t: number; c: number };

  const recent = db.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 8").all() as Order[];
  const lowStock = db.prepare("SELECT id, name, stock FROM products WHERE active = 1 AND stock <= 5 ORDER BY stock ASC LIMIT 8").all() as Pick<Product, "id" | "name" | "stock">[];
  const viewsToday = (db.prepare("SELECT COUNT(*) c FROM page_views WHERE date(created_at) = date('now')").get() as { c: number }).c;
  const viewsWeek = (db.prepare("SELECT COUNT(*) c FROM page_views WHERE created_at >= datetime('now', '-7 days')").get() as { c: number }).c;
  const viewsPrevWeek = (db.prepare("SELECT COUNT(*) c FROM page_views WHERE created_at >= datetime('now', '-14 days') AND created_at < datetime('now', '-7 days')").get() as { c: number }).c;
  const ordersWeek = (db.prepare("SELECT COUNT(*) c FROM orders WHERE status != 'cancelled' AND created_at >= datetime('now', '-7 days')").get() as { c: number }).c;
  const ordersPrevWeek = (db.prepare("SELECT COUNT(*) c FROM orders WHERE status != 'cancelled' AND created_at >= datetime('now', '-14 days') AND created_at < datetime('now', '-7 days')").get() as { c: number }).c;
  const convWeek = viewsWeek > 0 ? (ordersWeek / viewsWeek) * 100 : 0;
  const convPrevWeek = viewsPrevWeek > 0 ? (ordersPrevWeek / viewsPrevWeek) * 100 : 0;
  const leadsCount = (db.prepare("SELECT COUNT(*) c FROM cart_leads WHERE reminded = 0").get() as { c: number }).c;
  const customersCount = (db.prepare("SELECT COUNT(*) c FROM customers").get() as { c: number }).c;
  const topPages = db.prepare("SELECT path, COUNT(*) c FROM page_views WHERE created_at >= datetime('now', '-7 days') GROUP BY path ORDER BY c DESC LIMIT 6").all() as { path: string; c: number }[];

  const statusRows = db.prepare("SELECT status, COUNT(*) c FROM orders WHERE created_at >= date('now', 'start of month') GROUP BY status").all() as { status: string; c: number }[];
  const statusMap = Object.fromEntries(statusRows.map((r) => [r.status, r.c]));
  const maxStatus = Math.max(1, ...STATUS_ORDER.map((k) => statusMap[k] || 0));

  const topProducts = db.prepare(
    `SELECT oi.name AS name, SUM(oi.qty) AS qty, SUM(oi.qty * oi.price) AS rev
     FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE o.status != 'cancelled' AND o.created_at >= datetime('now', '-30 days')
     GROUP BY oi.name ORDER BY qty DESC, rev DESC LIMIT 5`
  ).all() as { name: string; qty: number; rev: number }[];

  const days: { day: string; total: number; count: number; showLabel: boolean }[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const row = db.prepare(
      `SELECT COALESCE(SUM(total),0) t, COUNT(*) c FROM orders WHERE status != 'cancelled' AND date(created_at) = date('now', ?)`
    ).get(`-${i} days`) as { t: number; c: number };
    const dt = new Date(Date.now() - i * 86400000);
    const label = range === 7
      ? dt.toLocaleDateString("ar-LY", { weekday: "short" })
      : `${dt.getDate()}/${dt.getMonth() + 1}`;
    days.push({ day: label, total: row.t, count: row.c, showLabel: range === 7 || i % 5 === 0 || i === 0 });
  }
  const maxDay = Math.max(1, ...days.map((d) => d.total));
  const periodTotal = days.reduce((a, d) => a + d.total, 0);
  const BAR_MAX = 110;

  const todayStr = new Date().toLocaleDateString("ar-LY", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Tripoli" });

  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">مرحباً بك 👋</h1>
      <p className="mt-1 text-neutral-500">نظرة سريعة على أداء متجرك — {todayStr}</p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Banknote} color="bg-emerald-500" value={formatPrice(today.t, cur)} label="مبيعات اليوم"
          delta={<Delta now={today.t} prev={yesterday.t} label="عن أمس" />} />
        <StatCard icon={ShoppingCart} color="bg-blue-500" value={today.c} label="طلبات اليوم"
          delta={<Delta now={today.c} prev={yesterday.c} label="عن أمس" />} />
        <StatCard href="/admin/orders?status=new" icon={Clock} color="bg-amber-500" value={totals.newOrders} label="طلبات جديدة"
          hint="اضغط للعرض والمعالجة ←" />
        <StatCard icon={TrendingUp} color="bg-violet-500" value={`${convWeek.toFixed(1)}%`} label="معدل التحويل (زيارة ← طلب) هذا الأسبوع"
          delta={<Delta now={Math.round(convWeek * 10)} prev={Math.round(convPrevWeek * 10)} label="عن الأسبوع الماضي" />} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Banknote} color="bg-emerald-600" value={formatPrice(totals.revenue, cur)} label="إجمالي المبيعات" />
        <StatCard href="/admin/orders" icon={ShoppingCart} color="bg-blue-600" value={totals.orders} label="كل الطلبات" hint="اضغط للعرض ←" />
        <StatCard href="/admin/products" icon={Package} color="bg-purple-500" value={totals.products} label="المنتجات" hint="اضغط للإدارة ←" />
        <StatCard icon={Eye} color="bg-sky-500" value={viewsToday} label={`زيارات اليوم (${viewsWeek} هذا الأسبوع)`} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard href="/admin/leads" icon={ShoppingBag} color="bg-orange-500" value={leadsCount} label="سلات مهجورة بانتظار التذكير" hint="اضغط للتذكير ←" />
        <StatCard href="/admin/customers" icon={Users} color="bg-indigo-500" value={customersCount} label="حسابات الزبائن" hint="اضغط للعرض ←" />
        <div className="rounded-3xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-2 text-sm font-extrabold">أكثر الصفحات زيارة (7 أيام)</h2>
          {topPages.length === 0 ? <p className="text-xs text-neutral-400">لا بيانات بعد</p> : (
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              {topPages.map((p) => <li key={p.path} className="flex justify-between gap-2"><span className="line-clamp-1 text-neutral-500" dir="ltr">{p.path}</span><b>{p.c}</b></li>)}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-3">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-extrabold">مبيعات آخر {range === 7 ? "7 أيام" : "30 يوماً"}</h2>
            <div className="flex rounded-xl bg-[#f5f5f7] p-1 text-xs font-bold">
              <Link href="/admin" className={range === 7 ? "rounded-lg bg-neutral-900 px-3 py-1.5 text-white" : "px-3 py-1.5 text-neutral-500 hover:text-neutral-800"}>7 أيام</Link>
              <Link href="/admin?range=30" className={range === 30 ? "rounded-lg bg-neutral-900 px-3 py-1.5 text-white" : "px-3 py-1.5 text-neutral-500 hover:text-neutral-800"}>30 يوم</Link>
            </div>
          </div>
          <div className="flex h-44 items-end justify-between gap-2">
            {days.map((d, idx) => (
              <div key={idx} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-[10px] font-bold text-neutral-400">{range === 7 && d.total > 0 ? formatPrice(d.total, cur) : ""}</span>
                <div
                  className={`w-full max-w-10 rounded-t-lg transition-all ${idx === days.length - 1 ? "bg-emerald-500" : "bg-[var(--accent)]/90"}`}
                  style={{ height: `${Math.max(3, Math.round((d.total / maxDay) * BAR_MAX))}px` }}
                  title={`${formatPrice(d.total, cur)} · ${d.count} طلب`}
                />
                <span className="text-[10px] font-bold text-neutral-500">{d.showLabel ? d.day : ""}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-neutral-100 pt-3 text-xs font-bold text-neutral-500">
            إجمالي الفترة: {formatPrice(periodTotal, cur)} · متوسط يومي: {formatPrice(Math.round(periodTotal / range), cur)}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-extrabold"><PieChart size={18} className="text-violet-500" /> الطلبات حسب الحالة (هذا الشهر)</h2>
          <div className="space-y-3">
            {STATUS_ORDER.map((k) => {
              const c = statusMap[k] || 0;
              return (
                <Link key={k} href={`/admin/orders?status=${k}`} className="group flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs font-bold text-neutral-600 group-hover:text-neutral-900">{STATUS_LABEL[k]}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <span className={`block h-full rounded-full ${STATUS_BAR[k]}`} style={{ width: `${c === 0 ? 0 : Math.max(6, (c / maxStatus) * 100)}%` }} />
                  </span>
                  <b className="w-6 text-left text-xs">{c}</b>
                </Link>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] font-bold text-[var(--accent)]">كل حالة رابط يفتح قائمة الطلبات مفلترة عليها</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-3">
          <h2 className="mb-4 flex items-center gap-2 font-extrabold"><Trophy size={18} className="text-amber-500" /> أكثر المنتجات مبيعاً (30 يوماً)</h2>
          {topProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">لا مبيعات في آخر 30 يوماً</p>
          ) : (
            <ul className="space-y-2">
              {topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 rounded-xl bg-[#f5f5f7] px-4 py-2.5 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-neutral-900 text-xs font-black text-white">{i + 1}</span>
                  <span className="line-clamp-1 flex-1 font-bold">{p.name}</span>
                  <span className="shrink-0 text-xs font-extrabold text-emerald-600">{p.qty} قطعة · {formatPrice(p.rev, cur)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-extrabold"><AlertTriangle size={18} className="text-amber-500" /> مخزون منخفض</h2>
          {lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">كل المنتجات بمخزون جيد 👍</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center justify-between rounded-xl bg-[#f5f5f7] px-4 py-2.5 text-sm transition hover:bg-neutral-200/60">
                    <span className="line-clamp-1 font-bold">{p.name}</span>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${p.stock === 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>{p.stock === 0 ? "نفد" : p.stock}</span>
                  </Link>
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
