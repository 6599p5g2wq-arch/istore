import React from "react";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice, formatDate } from "@/lib/format";
import { waNumber } from "@/lib/phone";
import CustomersSearch from "@/components/admin/CustomersSearch";
import { Download, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

type Row = { id: number; name: string; email: string; phone: string; created_at: string; last_login: string | null; blocked: number; oc: number; spent: number; last_order: string | null };
type Guest = { name: string; phone: string; oc: number; spent: number; last_order: string };

const SORTS: Record<string, { label: string; sql: string }> = {
  new: { label: "الأحدث", sql: "c.id DESC" },
  spent: { label: "الأكثر شراءً", sql: "spent DESC" },
  orders: { label: "الأكثر طلبات", sql: "oc DESC" },
};

export default function AdminCustomers({ searchParams }: { searchParams: { tab?: string; sort?: string } }) {
  const db = getDb();
  const s = getSettings();
  const tab = searchParams.tab === "guests" ? "guests" : "accounts";
  const sort = SORTS[searchParams.sort || ""] ? (searchParams.sort as string) : "new";
  const accCount = (db.prepare("SELECT COUNT(*) c FROM customers").get() as { c: number }).c;
  const guestCount = (db.prepare("SELECT COUNT(DISTINCT phone) c FROM orders WHERE customer_id IS NULL").get() as { c: number }).c;

  const accounts = tab === "accounts"
    ? db.prepare(`SELECT c.id, c.name, c.email, c.phone, c.created_at, c.last_login, c.blocked, COUNT(o.id) oc,
        COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total END), 0) spent, MAX(o.created_at) last_order
        FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY ${SORTS[sort].sql}`).all() as Row[]
    : [];
  const guests = tab === "guests"
    ? db.prepare(`SELECT MAX(customer_name) name, phone, COUNT(*) oc, COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total END), 0) spent, MAX(created_at) last_order
        FROM orders WHERE customer_id IS NULL GROUP BY phone ORDER BY last_order DESC`).all() as Guest[]
    : [];

  const tabs = [
    { key: "accounts", label: `حسابات مسجلة (${accCount})` },
    { key: "guests", label: `عملاء بدون حساب (${guestCount})` },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black sm:text-3xl">الزبائن</h1>
        <a href={`/api/admin/customers/export?tab=${tab}`} className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-bold text-neutral-700 shadow-sm transition hover:bg-neutral-100">
          <Download size={16} /> تصدير CSV
        </a>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link key={t.key} href={`/admin/customers?tab=${t.key}`}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${tab === t.key ? "bg-black text-white" : "bg-white text-neutral-600 shadow-sm hover:bg-neutral-100"}`}>{t.label}</Link>
        ))}
      </div>

      {tab === "accounts" && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CustomersSearch />
          <div className="flex gap-2 text-xs font-bold">
            {Object.entries(SORTS).map(([k, v]) => (
              <Link key={k} href={`/admin/customers?tab=accounts&sort=${k}`} className={`rounded-full px-3 py-1.5 ${sort === k ? "bg-neutral-900 text-white" : "bg-white text-neutral-500 shadow-sm"}`}>{v.label}</Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-3xl bg-white p-4 shadow-sm">
        {tab === "accounts" ? (
          accounts.length === 0 ? <p className="py-12 text-center text-sm text-neutral-400">لا توجد حسابات مسجلة بعد</p> : (
            <>
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b text-right text-xs text-neutral-400">
                    <th className="p-3 font-bold">الاسم</th><th className="p-3 font-bold">الهاتف</th><th className="p-3 font-bold">البريد</th>
                    <th className="p-3 font-bold">الطلبات</th><th className="p-3 font-bold">إجمالي المشتريات</th><th className="p-3 font-bold">آخر طلب</th><th className="p-3 font-bold">التسجيل</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((c) => (
                    <tr key={c.id} data-search={`${c.name} ${c.phone} ${c.email}`.toLowerCase()} className="js-customer-row border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60">
                      <td className="p-3">
                        <Link href={`/admin/customers/${c.id}`} className="font-extrabold text-[var(--accent)]">{c.name}</Link>
                        {c.blocked ? <span className="mr-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-extrabold text-red-600">موقوف</span> : null}
                      </td>
                      <td className="p-3 text-neutral-500" dir="ltr">{c.phone}</td>
                      <td className="p-3 text-neutral-500" dir="ltr">{c.email}</td>
                      <td className="p-3 font-bold">{c.oc}</td>
                      <td className="p-3 font-bold">{formatPrice(c.spent, s.currency)}</td>
                      <td className="p-3 text-xs text-neutral-400">{c.last_order ? formatDate(c.last_order) : "—"}</td>
                      <td className="p-3 text-xs text-neutral-400">{formatDate(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p id="customers-empty" style={{ display: "none" }} className="py-10 text-center text-sm text-neutral-400">لا يوجد زبون مطابق</p>
            </>
          )
        ) : guests.length === 0 ? <p className="py-12 text-center text-sm text-neutral-400">لا يوجد عملاء بدون حساب</p> : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-right text-xs text-neutral-400">
                <th className="p-3 font-bold">الاسم</th><th className="p-3 font-bold">الهاتف</th><th className="p-3 font-bold">الطلبات</th>
                <th className="p-3 font-bold">إجمالي المشتريات</th><th className="p-3 font-bold">آخر طلب</th><th className="p-3 font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.phone} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60">
                  <td className="p-3 font-bold">{g.name}</td>
                  <td className="p-3 text-neutral-500" dir="ltr">{g.phone}</td>
                  <td className="p-3 font-bold">{g.oc}</td>
                  <td className="p-3 font-bold">{formatPrice(g.spent, s.currency)}</td>
                  <td className="p-3 text-xs text-neutral-400">{formatDate(g.last_order)}</td>
                  <td className="p-3"><a href={`https://wa.me/${waNumber(g.phone)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white"><MessageCircle size={13} /> واتساب</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
