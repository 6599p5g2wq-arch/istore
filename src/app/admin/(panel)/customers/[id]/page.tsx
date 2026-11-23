import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice, formatDate } from "@/lib/format";
import { waNumber } from "@/lib/phone";
import CustomerActions from "@/components/admin/CustomerActions";
import CustomerPoints from "@/components/admin/CustomerPoints";
import { getProgram, isVip } from "@/lib/loyalty";
import { ArrowRight, Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { new: "جديد", confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التوصيل", cancelled: "ملغي" };
type C = { id: number; name: string; email: string; phone: string; created_at: string; last_login: string | null; blocked: number; city: string; address: string; points: number; vip_override: number | null };

export default function CustomerDetail({ params }: { params: { id: string } }) {
  const db = getDb();
  const s = getSettings();
  let backHref = "/admin/customers";
  try {
    const u = new URL(headers().get("referer") || "");
    if (u.pathname === "/admin/customers") backHref = u.pathname + u.search;
  } catch { /* لا مُحيل صالح */ }
  const c = db.prepare("SELECT * FROM customers WHERE id = ?").get(params.id) as C | undefined;
  if (!c) notFound();
  const orders = db.prepare("SELECT * FROM orders WHERE customer_id = ? OR (customer_id IS NULL AND phone = ?) ORDER BY id DESC").all(c.id, c.phone || "\0") as (Order & { customer_id: number | null })[];
  const valid = orders.filter((o) => o.status !== "cancelled");
  const spent = valid.reduce((a, o) => a + o.total, 0);
  const avg = valid.length ? spent / valid.length : 0;
  const waPhone = waNumber(c.phone);
  const prog = getProgram(db);
  const vip = isVip(spent, c.vip_override, prog);
  const plog = db.prepare("SELECT delta, reason, created_at FROM points_log WHERE customer_id = ? ORDER BY id DESC LIMIT 20").all(c.id) as { delta: number; reason: string; created_at: string }[];

  return (
    <div className="max-w-4xl">
      <Link href={backHref} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-3 font-bold text-neutral-700 shadow-sm transition hover:bg-neutral-100">
        <ArrowRight size={18} /> رجوع للزبائن
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-black sm:text-3xl">{c.name}</h1>
        {vip && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-700">★ VIP</span>}
        {c.blocked ? <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-extrabold text-red-600">موقوف</span> : <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">نشط</span>}
      </div>
      <p className="mt-1 text-sm text-neutral-400">مسجّل منذ {formatDate(c.created_at)}{c.last_login ? ` · آخر دخول ${formatDate(c.last_login)}` : ""}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs text-neutral-400">إجمالي المشتريات</p><p className="mt-1 text-2xl font-black">{formatPrice(spent, s.currency)}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs text-neutral-400">عدد الطلبات</p><p className="mt-1 text-2xl font-black">{orders.length}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs text-neutral-400">متوسط الطلب</p><p className="mt-1 text-2xl font-black">{formatPrice(avg, s.currency)}</p></div>
      </div>

      <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="mb-1 font-extrabold">نقاط الولاء</h2>
        <p className="text-2xl font-black">{c.points} <span className="text-sm font-bold text-neutral-400">نقطة{prog.loyalty.enabled ? "" : " (البرنامج متوقف)"}</span></p>
        <div className="mt-4"><CustomerPoints id={c.id} vip={c.vip_override === 1 ? "on" : c.vip_override === 0 ? "off" : "auto"} /></div>
        {plog.length > 0 && (
          <ul className="mt-4 divide-y divide-neutral-50 text-sm">
            {plog.map((l, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2">
                <span className="text-neutral-600">{l.reason}</span>
                <span className="flex items-center gap-3"><span className="text-xs text-neutral-400">{formatDate(l.created_at)}</span><b dir="ltr" className={l.delta > 0 ? "text-emerald-600" : "text-red-600"}>{l.delta > 0 ? "+" : ""}{l.delta}</b></span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-extrabold">معلومات التواصل</h2>
        <p className="flex items-center gap-2 text-sm text-neutral-600"><Phone size={15} /> <a dir="ltr" href={`tel:${c.phone}`}>{c.phone || "—"}</a></p>
        <p className="mt-2 flex items-center gap-2 text-sm text-neutral-600"><Mail size={15} /> <span dir="ltr">{c.email}</span></p>
        {(c.city || c.address) && <p className="mt-2 flex items-center gap-2 text-sm text-neutral-600"><MapPin size={15} /> {c.city}{c.address ? ` — ${c.address}` : ""}</p>}
        <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"><MessageCircle size={15} /> مراسلة واتساب</a>
      </div>

      <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-extrabold">طلباته</h2>
        {orders.length === 0 ? <p className="py-6 text-center text-sm text-neutral-400">لا توجد طلبات</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead><tr className="border-b text-right text-xs text-neutral-400"><th className="p-3 font-bold">رقم الطلب</th><th className="p-3 font-bold">التاريخ</th><th className="p-3 font-bold">الحالة</th><th className="p-3 font-bold">الإجمالي</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-neutral-50 last:border-0">
                    <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-extrabold text-[var(--accent)]" dir="ltr">{o.code}</Link>{o.customer_id === null && <span className="mr-2 text-[11px] text-neutral-400">(كزائر بنفس الهاتف)</span>}</td>
                    <td className="p-3 text-xs text-neutral-400">{formatDate(o.created_at)}</td>
                    <td className="p-3 font-bold">{STATUS_LABEL[o.status] || o.status}</td>
                    <td className="p-3 font-bold">{formatPrice(o.total, s.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-5"><CustomerActions customer={{ id: c.id, name: c.name, email: c.email, phone: c.phone, blocked: c.blocked }} waPhone={waPhone} storeName={s.store_name || "آي ستور"} /></div>
    </div>
  );
}
