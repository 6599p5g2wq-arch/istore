import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice, formatDate } from "@/lib/format";
import { waNumber } from "@/lib/phone";
import { ArrowRight, Phone, MapPin, MessageCircle } from "lucide-react";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { new: "جديد", confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التوصيل", cancelled: "ملغي" };

export default function GuestDetail({ searchParams }: { searchParams: { phone?: string } }) {
  const phone = (searchParams.phone || "").trim();
  if (!phone) notFound();
  const db = getDb();
  const s = getSettings();
  const orders = db.prepare("SELECT * FROM orders WHERE customer_id IS NULL AND phone = ? ORDER BY id DESC").all(phone) as Order[];
  if (orders.length === 0) notFound();
  const name = orders[0].customer_name;
  const valid = orders.filter((o) => o.status !== "cancelled");
  const spent = valid.reduce((a, o) => a + o.total, 0);
  const avg = valid.length ? spent / valid.length : 0;
  const waPhone = waNumber(phone);

  const addrMap = new Map<string, { city: string; address: string; n: number; last: string }>();
  for (const o of orders) {
    const k = `${o.city}||${o.address}`.trim();
    const cur = addrMap.get(k);
    if (cur) cur.n += 1; else addrMap.set(k, { city: o.city, address: o.address, n: 1, last: o.created_at });
  }
  const pastAddrs = Array.from(addrMap.values());

  return (
    <div className="max-w-4xl">
      <Link href="/admin/customers?tab=guests" className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-3 font-bold text-neutral-700 shadow-sm transition hover:bg-neutral-100">
        <ArrowRight size={18} /> رجوع للزبائن
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-black sm:text-3xl">{name}</h1>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-extrabold text-neutral-600">عميل بدون حساب</span>
      </div>
      <p className="mt-1 text-sm text-neutral-400" dir="ltr">{phone}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs text-neutral-400">إجمالي المشتريات</p><p className="mt-1 text-2xl font-black">{formatPrice(spent, s.currency)}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs text-neutral-400">عدد الطلبات</p><p className="mt-1 text-2xl font-black">{orders.length}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs text-neutral-400">متوسط الطلب</p><p className="mt-1 text-2xl font-black">{formatPrice(avg, s.currency)}</p></div>
      </div>

      <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-extrabold">التواصل</h2>
        <div className="flex flex-wrap items-center gap-3">
          <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-neutral-700"><Phone size={15} /> اتصال</a>
          <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"><MessageCircle size={15} /> مراسلة واتساب</a>
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-extrabold"><MapPin size={17} /> عناوين من طلباته</h2>
        <ul className="space-y-2">
          {pastAddrs.map((a, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-neutral-50 px-4 py-3 text-sm">
              <span className="font-bold">{a.city}{a.address ? ` — ${a.address}` : ""}</span>
              <span className="text-xs text-neutral-400">{a.n} {a.n === 1 ? "طلب" : "طلبات"} · آخر استخدام {formatDate(a.last)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-extrabold">طلباته</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead><tr className="border-b text-right text-xs text-neutral-400"><th className="p-3 font-bold">رقم الطلب</th><th className="p-3 font-bold">التاريخ</th><th className="p-3 font-bold">الحالة</th><th className="p-3 font-bold">الإجمالي</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-neutral-50 last:border-0">
                  <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-extrabold text-[var(--accent)]" dir="ltr">{o.code}</Link></td>
                  <td className="p-3 text-xs text-neutral-400">{formatDate(o.created_at)}</td>
                  <td className="p-3 font-bold">{STATUS_LABEL[o.status] || o.status}</td>
                  <td className="p-3 font-bold">{formatPrice(o.total, s.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
