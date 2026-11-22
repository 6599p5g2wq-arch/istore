import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSessionCustomer } from "@/lib/customer-auth";
import { formatPrice, formatDate } from "@/lib/format";
import AccountForms from "@/components/store/AccountForms";
import LogoutButton from "@/components/store/LogoutButton";
import { Package, Mail, Phone, ChevronLeft } from "lucide-react";
import type { Order } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "حسابي" };

const STATUS_LABEL: Record<string, string> = { new: "قيد المراجعة", confirmed: "مؤكد", shipped: "في الطريق", delivered: "تم التوصيل", cancelled: "ملغي" };
const STATUS_CLS: Record<string, string> = {
  new: "bg-amber-500/10 text-amber-400", confirmed: "bg-blue-500/10 text-blue-400", shipped: "bg-purple-500/10 text-purple-400",
  delivered: "bg-emerald-500/10 text-emerald-400", cancelled: "bg-red-500/10 text-red-400",
};

export default function AccountPage() {
  const customer = getSessionCustomer();
  if (!customer) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-12 sm:px-6">
        <h1 className="text-center text-3xl font-black text-white sm:text-4xl">حسابي</h1>
        <p className="mt-3 text-center text-neutral-400">سجل دخولك لمتابعة طلباتك وبياناتك</p>
        <AccountForms />
      </div>
    );
  }

  const db = getDb();
  const orders = db.prepare("SELECT * FROM orders WHERE customer_id = ? OR phone = ? ORDER BY id DESC LIMIT 20").all(customer.id, customer.phone || "\0") as Order[];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">مرحباً، {customer.name} 👋</h1>
          <p className="mt-2 flex flex-wrap items-center gap-4 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5"><Mail size={14} /> <span dir="ltr">{customer.email}</span></span>
            {customer.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> <span dir="ltr">{customer.phone}</span></span>}
          </p>
        </div>
        <LogoutButton />
      </div>

      <h2 className="mt-12 flex items-center gap-2 text-xl font-extrabold text-white"><Package size={20} className="text-[var(--accent)]" /> طلباتي</h2>
      {orders.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-white/5 py-16 text-center">
          <p className="font-bold text-neutral-400">لا توجد طلبات بعد</p>
          <Link href="/products" className="mt-5 inline-flex items-center gap-1 rounded-full bg-white px-8 py-3 font-bold text-black hover:bg-neutral-200">
            تسوق الآن <ChevronLeft size={16} />
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/order-success/${o.code}`} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 transition hover:border-white/25">
                <span className="font-extrabold text-white" dir="ltr">{o.code}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLS[o.status] || "bg-white/10 text-neutral-300"}`}>{STATUS_LABEL[o.status] || o.status}</span>
                <span className="mr-auto text-sm text-neutral-400">{formatDate(o.created_at)}</span>
                <span className="font-extrabold text-white">{formatPrice(o.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
