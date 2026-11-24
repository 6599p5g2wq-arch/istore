import React from "react";
import {OrdersSelection,OrderCheckbox} from "@/components/admin/OrdersSelection";
import OrdersExport from "@/components/admin/OrdersExport";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice, formatDate } from "@/lib/format";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import OrderRow from "@/components/admin/OrderRow";
import { Search, Package } from "lucide-react";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { new: "جديد", confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التوصيل", cancelled: "ملغي" };
const PERIODS = [
  { key: "all", label: "كل الفترات" },
  { key: "today", label: "اليوم" },
  { key: "week", label: "الأسبوع" },
  { key: "month", label: "الشهر" },
];
const PER_PAGE = 20;

export default async function AdminOrders(
  props: { searchParams: Promise<{ status?: string; q?: string; period?: string; page?: string }> }
) {
  const searchParams = await props.searchParams;
  const db = getDb();
  const s = getSettings();
  const st = searchParams.status || "";
  const q = (searchParams.q || "").trim();
  const period = PERIODS.some((p) => p.key === searchParams.period) ? (searchParams.period as string) : "all";
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);

  const conds: string[] = [];
  const args: (string | number)[] = [];
  if (st) { conds.push("status = ?"); args.push(st); }
  if (period === "today") conds.push("date(created_at) = date('now')");
  if (period === "week") conds.push("created_at >= datetime('now', '-7 days')");
  if (period === "month") conds.push("created_at >= date('now', 'start of month')");
  if (q) {
    conds.push("(code LIKE ? OR customer_name LIKE ? OR phone LIKE ?)");
    const like = `%${q}%`;
    args.push(like, like, like);
  }
  const where = conds.length ? ` WHERE ${conds.join(" AND ")}` : "";

  const agg = db.prepare(`SELECT COUNT(*) c, COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total END), 0) v FROM orders${where}`).get(...args) as { c: number; v: number };
  const pages = Math.max(1, Math.ceil(agg.c / PER_PAGE));
  const curPage = Math.min(page, pages);
  const orders = db.prepare(`SELECT * FROM orders${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args, PER_PAGE, (curPage - 1) * PER_PAGE) as Order[];

  const counts = Object.fromEntries((db.prepare("SELECT status, COUNT(*) c FROM orders GROUP BY status").all() as { status: string; c: number }[]).map((r) => [r.status, r.c]));
  const total = Object.values(counts).reduce((a: number, b) => a + (b as number), 0);
  const repeatPhones = new Set(
    (db.prepare("SELECT phone FROM orders GROUP BY phone HAVING COUNT(*) > 1").all() as { phone: string }[]).map((r) => r.phone)
  );

  const tabs = [
    { key: "", label: `الكل (${total})` },
    { key: "new", label: `جديدة (${counts.new || 0})` },
    { key: "confirmed", label: `مؤكدة (${counts.confirmed || 0})` },
    { key: "shipped", label: `مشحونة (${counts.shipped || 0})` },
    { key: "delivered", label: `مكتملة (${counts.delivered || 0})` },
    { key: "cancelled", label: `ملغية (${counts.cancelled || 0})` },
  ];

  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    const merged: Record<string, string> = { status: st, q, period, page: "", ...over };
    for (const [k, v] of Object.entries(merged)) {
      if (!v) continue;
      if (k === "period" && v === "all") continue;
      p.set(k, v);
    }
    const str = p.toString();
    return `/admin/orders${str ? `?${str}` : ""}`;
  };

  const periodLabel = PERIODS.find((p) => p.key === period)?.label || "";

  return (
    <OrdersSelection ids={orders.map(o=>o.id)}><div>
      <h1 className="text-2xl font-black sm:text-3xl">الطلبات</h1>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <form action="/admin/orders" method="get" className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm">
          {st ? <input type="hidden" name="status" value={st} /> : null}
          {period !== "all" ? <input type="hidden" name="period" value={period} /> : null}
          <Search size={16} className="shrink-0 text-neutral-400" />
          <input name="q" defaultValue={q} placeholder="ابحث برقم الطلب، اسم العميل، أو الهاتف…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400" />
          <button className="shrink-0 rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-bold text-white">بحث</button>
        </form>
        <OrdersExport status={st} />
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <Link key={p.key} href={qs({ period: p.key, page: "" })}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${period === p.key ? "bg-neutral-900 text-white" : "bg-white text-neutral-500 shadow-sm hover:bg-neutral-100"}`}>
              {p.label}
            </Link>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs font-bold text-neutral-400">
        {agg.c} طلب{period !== "all" ? ` (${periodLabel})` : ""}{q ? ` لبحث «${q}»` : ""} · إجمالي القيمة {formatPrice(agg.v, s.currency)} <span className="font-normal">(بدون الملغية)</span>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link key={t.key} href={qs({ status: t.key, page: "" })}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${st === t.key ? "bg-black text-white" : "bg-white text-neutral-600 shadow-sm hover:bg-neutral-100"}`}>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {orders.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <Package size={28} className="mx-auto text-neutral-300" />
            <p className="mt-3 text-sm text-neutral-400">لا توجد طلبات مطابقة</p>
          </div>
        ) : (
          <>
            {/* بطاقات الموبايل */}
            <div className="space-y-3 lg:hidden">
              {orders.map((o) => (
                <div key={o.id} className={`relative rounded-3xl bg-white p-4 shadow-sm ${o.status === "new" ? "border-r-4 border-amber-400" : ""}`}>
                  <Link href={`/admin/orders/${o.id}`} className="absolute inset-0 rounded-3xl" aria-label={o.code} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <OrderCheckbox id={o.id} code={o.code}/><span className="font-extrabold text-[var(--accent)]" dir="ltr">{o.code}</span>
                        {o.status === "new" && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white">جديد</span>}
                        {repeatPhones.has(o.phone) && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">زبون متكرر</span>}
                      </p>
                      <p className="mt-1 font-bold">{o.customer_name}</p>
                      <p className="mt-0.5 text-xs text-neutral-400"><span dir="ltr">{o.phone}</span> · {o.city} · {formatDate(o.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="font-black">{formatPrice(o.total, s.currency)}</p>
                      <span className="relative z-10"><OrderStatusSelect id={o.id} status={o.status} labels={STATUS_LABEL} /></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* جدول الديسكتوب */}
            <div className="hidden overflow-x-auto rounded-3xl bg-white p-4 shadow-sm lg:block">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b text-right text-xs text-neutral-400">
                    <th className="p-3 font-bold">رقم الطلب</th><th className="p-3 font-bold">العميل</th><th className="p-3 font-bold">الهاتف</th>
                    <th className="p-3 font-bold">المدينة</th><th className="p-3 font-bold">الإجمالي</th><th className="p-3 font-bold">التاريخ</th>
                    <th className="p-3 font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <OrderRow key={o.id} id={o.id}
                      className={`border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60 ${o.status === "new" ? "border-r-4 border-amber-400 bg-amber-50/40" : ""}`}>
                      <td className="p-3">
                        <span className="flex items-center gap-2">
                          <OrderCheckbox id={o.id} code={o.code}/><span className="font-extrabold text-[var(--accent)]" dir="ltr">{o.code}</span>
                          {o.status === "new" && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white">جديد</span>}
                        </span>
                      </td>
                      <td className="p-3 font-bold">
                        {o.customer_name}
                        {repeatPhones.has(o.phone) && <span className="mr-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">زبون متكرر</span>}
                      </td>
                      <td className="p-3 text-neutral-500" dir="ltr">{o.phone}</td>
                      <td className="p-3 text-neutral-500">{o.city}</td>
                      <td className="p-3 font-bold">{formatPrice(o.total, s.currency)}</td>
                      <td className="p-3 text-xs text-neutral-400">{formatDate(o.created_at)}</td>
                      <td className="p-3"><OrderStatusSelect id={o.id} status={o.status} labels={STATUS_LABEL} /></td>
                    </OrderRow>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm font-bold">
          {curPage > 1 && <Link href={qs({ page: String(curPage - 1) })} className="rounded-xl bg-white px-4 py-2 shadow-sm hover:bg-neutral-100">‹ السابق</Link>}
          {Array.from({ length: pages }, (_, i) => i + 1).slice(0, 7).map((n) => (
            <Link key={n} href={qs({ page: String(n) })}
              className={`rounded-xl px-4 py-2 shadow-sm ${n === curPage ? "bg-neutral-900 text-white" : "bg-white hover:bg-neutral-100"}`}>{n}</Link>
          ))}
          {curPage < pages && <Link href={qs({ page: String(curPage + 1) })} className="rounded-xl bg-white px-4 py-2 shadow-sm hover:bg-neutral-100">التالي ›</Link>}
        </div>
      )}
    </div></OrdersSelection>
  );
}
