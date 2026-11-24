import React from "react";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice, formatDate } from "@/lib/format";
import { waNumber } from "@/lib/phone";
import CustomersSearch from "@/components/admin/CustomersSearch";
import NewCustomerButton from "@/components/admin/NewCustomerButton";
import { getProgram, isVip } from "@/lib/loyalty";
import { Download, MessageCircle, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

type Row = { id: number; name: string; email: string; phone: string; created_at: string; last_login: string | null; blocked: number; points: number; vip_override: number | null; oc: number; spent: number; last_order: string | null };
type Guest = { name: string; phone: string; oc: number; spent: number; last_order: string };

const SORTS: Record<string, { label: string; sql: string }> = {
  new: { label: "الأحدث", sql: "c.id DESC" },
  spent: { label: "الأكثر شراءً", sql: "spent DESC" },
  orders: { label: "الأكثر طلبات", sql: "oc DESC" },
};
const GUEST_SORTS: Record<string, { label: string; sql: string }> = {
  new: { label: "الأحدث", sql: "last_order DESC" },
  spent: { label: "الأكثر شراءً", sql: "spent DESC" },
  orders: { label: "الأكثر طلبات", sql: "oc DESC" },
};
const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "vip", label: "VIP" },
  { key: "blocked", label: "موقوف" },
  { key: "active", label: "نشط" },
];

export default async function AdminCustomers(
  props: { searchParams: Promise<{ tab?: string; sort?: string; f?: string }> }
) {
  const searchParams = await props.searchParams;
  const db = getDb();
  const s = getSettings();
  const tab = searchParams.tab === "guests" ? "guests" : "accounts";
  const sort = SORTS[searchParams.sort || ""] ? (searchParams.sort as string) : "new";
  const f = FILTERS.some((x) => x.key === searchParams.f) ? (searchParams.f as string) : "all";
  const accCount = (db.prepare("SELECT COUNT(*) c FROM customers").get() as { c: number }).c;
  const guestCount = (db.prepare("SELECT COUNT(DISTINCT phone) c FROM orders WHERE customer_id IS NULL").get() as { c: number }).c;
  const prog = getProgram(db);

  let accounts = tab === "accounts"
    ? db.prepare(`SELECT c.id, c.name, c.email, c.phone, c.created_at, c.last_login, c.blocked, c.points, c.vip_override, COUNT(o.id) oc,
        COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total END), 0) spent, MAX(o.created_at) last_order
        FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY ${SORTS[sort].sql}`).all() as Row[]
    : [];
  if (f === "vip") accounts = accounts.filter((c) => isVip(c.spent, c.vip_override, prog));
  else if (f === "blocked") accounts = accounts.filter((c) => c.blocked);
  else if (f === "active") accounts = accounts.filter((c) => !c.blocked);

  const guests = tab === "guests"
    ? db.prepare(`SELECT MAX(customer_name) name, phone, COUNT(*) oc, COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total END), 0) spent, MAX(created_at) last_order
        FROM orders WHERE customer_id IS NULL GROUP BY phone ORDER BY ${GUEST_SORTS[sort].sql}`).all() as Guest[]
    : [];

  const tabs = [
    { key: "accounts", label: `حسابات مسجلة (${accCount})` },
    { key: "guests", label: `عملاء بدون حساب (${guestCount})` },
  ];
  const sorts = tab === "guests" ? GUEST_SORTS : SORTS;
  const waBtn = (phone: string) => (
    <a href={`https://wa.me/${waNumber(phone)}`} target="_blank" rel="noreferrer" aria-label="واتساب" title="واتساب"
      className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white transition hover:opacity-90"><MessageCircle size={14} /></a>
  );
  const telBtn = (phone: string) => (
    <a href={`tel:${phone}`} aria-label="اتصال" title="اتصال"
      className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"><Phone size={14} /></a>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black sm:text-3xl">الزبائن</h1>
        <div className="flex flex-wrap items-center gap-2">
          <NewCustomerButton storeName={s.store_name || "آي ستور"} />
          <a href={`/api/admin/customers/export?tab=${tab}`} className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-bold text-neutral-700 shadow-sm transition hover:bg-neutral-100">
            <Download size={16} /> تصدير CSV
          </a>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link key={t.key} href={`/admin/customers?tab=${t.key}`}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${tab === t.key ? "bg-black text-white" : "bg-white text-neutral-600 shadow-sm hover:bg-neutral-100"}`}>{t.label}</Link>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <CustomersSearch />
        <div className="flex gap-2 text-xs font-bold">
          {Object.entries(sorts).map(([k, v]) => (
            <Link key={k} href={`/admin/customers?tab=${tab}&sort=${k}${tab === "accounts" && f !== "all" ? `&f=${f}` : ""}`} className={`rounded-full px-3 py-1.5 ${sort === k ? "bg-neutral-900 text-white" : "bg-white text-neutral-500 shadow-sm"}`}>{v.label}</Link>
          ))}
        </div>
      </div>
      {tab === "accounts" && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          {FILTERS.map((x) => (
            <Link key={x.key} href={`/admin/customers?tab=accounts&sort=${sort}${x.key === "all" ? "" : `&f=${x.key}`}`}
              className={`rounded-full px-3 py-1.5 ${f === x.key ? "bg-violet-700 text-white" : "bg-white text-neutral-500 shadow-sm"}`}>{x.label}</Link>
          ))}
        </div>
      )}

      {tab === "accounts" ? (
        accounts.length === 0 ? <p className="mt-4 rounded-3xl bg-white py-12 text-center text-sm text-neutral-400 shadow-sm">{f === "all" ? "لا توجد حسابات مسجلة بعد" : "لا يوجد زبائن ضمن هذا الفلتر"}</p> : (
          <>
            {/* بطاقات الجوال */}
            <div className="mt-4 space-y-3 lg:hidden">
              {accounts.map((c) => (
                <div key={c.id} data-search={`${c.name} ${c.phone} ${c.email}`.toLowerCase()} className="js-customer-row rounded-3xl bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/admin/customers/${c.id}`} className="font-extrabold text-[var(--accent)]">{c.name}</Link>
                      {isVip(c.spent, c.vip_override, prog) && <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-700">★ VIP</span>}
                      {c.blocked ? <span className="mr-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-extrabold text-red-600">موقوف</span> : null}
                      <p className="mt-0.5 text-xs text-neutral-400" dir="ltr">{c.phone}</p>
                    </div>
                    <div className="flex gap-1.5">{telBtn(c.phone)}{waBtn(c.phone)}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-neutral-50 py-2"><p className="text-neutral-400">الطلبات</p><p className="font-extrabold">{c.oc}</p></div>
                    <div className="rounded-xl bg-neutral-50 py-2"><p className="text-neutral-400">المشتريات</p><p className="font-extrabold">{formatPrice(c.spent, s.currency)}</p></div>
                    <div className="rounded-xl bg-neutral-50 py-2"><p className="text-neutral-400">النقاط</p><p className="font-extrabold">{c.points}</p></div>
                  </div>
                </div>
              ))}
            </div>
            {/* جدول سطح المكتب */}
            <div className="mt-4 hidden overflow-x-auto rounded-3xl bg-white p-4 shadow-sm lg:block">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b text-right text-xs text-neutral-400">
                    <th className="p-3 font-bold">الاسم</th><th className="p-3 font-bold">الهاتف</th><th className="p-3 font-bold">البريد</th>
                    <th className="p-3 font-bold">الطلبات</th><th className="p-3 font-bold">إجمالي المشتريات</th><th className="p-3 font-bold">النقاط</th><th className="p-3 font-bold">آخر طلب</th><th className="p-3 font-bold">التسجيل</th><th className="p-3 font-bold"></th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((c) => (
                    <tr key={c.id} data-search={`${c.name} ${c.phone} ${c.email}`.toLowerCase()} className="js-customer-row border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60">
                      <td className="p-3">
                        <Link href={`/admin/customers/${c.id}`} className="font-extrabold text-[var(--accent)]">{c.name}</Link>
                        {isVip(c.spent, c.vip_override, prog) && <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-700">★ VIP</span>}
                        {c.blocked ? <span className="mr-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-extrabold text-red-600">موقوف</span> : null}
                      </td>
                      <td className="p-3 text-neutral-500" dir="ltr">{c.phone}</td>
                      <td className="p-3 text-neutral-500" dir="ltr">{c.email}</td>
                      <td className="p-3 font-bold">{c.oc}</td>
                      <td className="p-3 font-bold">{formatPrice(c.spent, s.currency)}</td>
                      <td className="p-3 font-bold">{c.points}</td>
                      <td className="p-3 text-xs text-neutral-400">{c.last_order ? formatDate(c.last_order) : "—"}</td>
                      <td className="p-3 text-xs text-neutral-400">{formatDate(c.created_at)}</td>
                      <td className="p-3"><div className="flex gap-1.5">{telBtn(c.phone)}{waBtn(c.phone)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p id="customers-empty" style={{ display: "none" }} className="mt-4 rounded-3xl bg-white py-10 text-center text-sm text-neutral-400 shadow-sm">لا يوجد زبون مطابق</p>
          </>
        )
      ) : guests.length === 0 ? <p className="mt-4 rounded-3xl bg-white py-12 text-center text-sm text-neutral-400 shadow-sm">لا يوجد عملاء بدون حساب</p> : (
        <>
          {/* بطاقات الجوال للضيوف */}
          <div className="mt-4 space-y-3 lg:hidden">
            {guests.map((g) => (
              <div key={g.phone} data-search={`${g.name} ${g.phone}`.toLowerCase()} className="js-customer-row rounded-3xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/admin/customers/guest?phone=${encodeURIComponent(g.phone)}`} className="font-extrabold text-[var(--accent)]">{g.name}</Link>
                    <p className="mt-0.5 text-xs text-neutral-400" dir="ltr">{g.phone}</p>
                  </div>
                  <div className="flex gap-1.5">{telBtn(g.phone)}{waBtn(g.phone)}</div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-neutral-50 py-2"><p className="text-neutral-400">الطلبات</p><p className="font-extrabold">{g.oc}</p></div>
                  <div className="rounded-xl bg-neutral-50 py-2"><p className="text-neutral-400">المشتريات</p><p className="font-extrabold">{formatPrice(g.spent, s.currency)}</p></div>
                  <div className="rounded-xl bg-neutral-50 py-2"><p className="text-neutral-400">آخر طلب</p><p className="font-extrabold">{formatDate(g.last_order)}</p></div>
                </div>
              </div>
            ))}
          </div>
          {/* جدول الضيوف لسطح المكتب */}
          <div className="mt-4 hidden overflow-x-auto rounded-3xl bg-white p-4 shadow-sm lg:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-right text-xs text-neutral-400">
                  <th className="p-3 font-bold">الاسم</th><th className="p-3 font-bold">الهاتف</th><th className="p-3 font-bold">الطلبات</th>
                  <th className="p-3 font-bold">إجمالي المشتريات</th><th className="p-3 font-bold">آخر طلب</th><th className="p-3 font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => (
                  <tr key={g.phone} data-search={`${g.name} ${g.phone}`.toLowerCase()} className="js-customer-row border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60">
                    <td className="p-3"><Link href={`/admin/customers/guest?phone=${encodeURIComponent(g.phone)}`} className="font-extrabold text-[var(--accent)]">{g.name}</Link></td>
                    <td className="p-3 text-neutral-500" dir="ltr">{g.phone}</td>
                    <td className="p-3 font-bold">{g.oc}</td>
                    <td className="p-3 font-bold">{formatPrice(g.spent, s.currency)}</td>
                    <td className="p-3 text-xs text-neutral-400">{formatDate(g.last_order)}</td>
                    <td className="p-3"><div className="flex gap-1.5">{telBtn(g.phone)}{waBtn(g.phone)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p id="customers-empty" style={{ display: "none" }} className="mt-4 rounded-3xl bg-white py-10 text-center text-sm text-neutral-400 shadow-sm">لا يوجد زبون مطابق</p>
        </>
      )}
    </div>
  );
}
