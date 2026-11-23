import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSessionCustomer } from "@/lib/customer-auth";
import { formatPrice, formatDate } from "@/lib/format";
import AccountForms from "@/components/store/AccountForms";
import LogoutButton from "@/components/store/LogoutButton";
import { ProfileForm, PasswordForm } from "@/components/store/AccountProfile";
import OrderTimeline from "@/components/store/OrderTimeline";
import { getSettings } from "@/lib/settings";
import { getProgram, isVip } from "@/lib/loyalty";
import { Gift, TicketPercent, Package, Mail, Phone, ChevronLeft, UserRound, KeyRound } from "lucide-react";
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
        <p className="mt-3 text-center text-[var(--text-dim)]">سجل دخولك لمتابعة طلباتك وبياناتك</p>
        <AccountForms whatsapp={getSettings().whatsapp} />
      </div>
    );
  }

  const db = getDb();
  const orders = db.prepare("SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC LIMIT 20").all(customer.id) as Order[];
  const prog = getProgram(db);
  const spent = (db.prepare("SELECT COALESCE(SUM(total), 0) s FROM orders WHERE customer_id = ? AND status != 'cancelled'").get(customer.id) as { s: number }).s;
  const vipRow = db.prepare("SELECT vip_override FROM customers WHERE id = ?").get(customer.id) as { vip_override: number | null };
  const vip = isVip(spent, vipRow.vip_override, prog);
  const today = new Date().toISOString().slice(0, 10);
  const myCoupons = db.prepare("SELECT code, kind, value, min_total, expires_at, max_uses, used_count FROM coupons WHERE customer_id = ? AND active = 1 ORDER BY id DESC").all(customer.id) as { code: string; kind: string; value: number; min_total: number; expires_at: string; max_uses: number; used_count: number }[];
  const liveCoupons = myCoupons.filter((c) => (!c.expires_at || c.expires_at >= today) && (c.max_uses === 0 || c.used_count < c.max_uses));
  const cityNames = (db.prepare("SELECT name FROM cities WHERE active = 1 ORDER BY sort_order, name").all() as { name: string }[]).map((c) => c.name);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">مرحباً، {customer.name} 👋{vip && <span className="mr-3 rounded-full bg-amber-500/15 px-3 py-1 align-middle text-sm font-extrabold text-amber-400">★ VIP</span>}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[var(--text-dim)]">
            <span className="flex items-center gap-1.5"><Mail size={14} /> <span dir="ltr">{customer.email}</span></span>
            {customer.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> <span dir="ltr">{customer.phone}</span></span>}
          </p>
        </div>
        <LogoutButton />
      </div>

      {(liveCoupons.length > 0 || (prog.loyalty.enabled && customer.points > 0)) && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {liveCoupons.map((c) => (
            <div key={c.code} className="rounded-2xl border border-[var(--border)] bg-white/[0.04] px-5 py-4">
              <p className="flex items-center gap-2 text-sm font-bold text-[var(--text-dim)]"><TicketPercent size={16} className="text-[var(--accent)]" /> كوبونك الخاص</p>
              <p className="mt-2 text-xl font-black text-white" dir="ltr">{c.code}</p>
              <p className="mt-1 text-xs text-[var(--text-dim)]">{c.kind === "percent" ? `خصم ${c.value}%` : `خصم ${formatPrice(c.value)}`}{c.expires_at ? ` · صالح حتى ${c.expires_at}` : ""} · خاص بحسابك فقط</p>
            </div>
          ))}
          {prog.loyalty.enabled && customer.points > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-white/[0.04] px-5 py-4">
              <p className="flex items-center gap-2 text-sm font-bold text-[var(--text-dim)]"><Gift size={16} className="text-[var(--accent)]" /> نقاط الولاء</p>
              <p className="mt-2 text-xl font-black text-white">{customer.points} نقطة</p>
              <p className="mt-1 text-xs text-[var(--text-dim)]">{prog.loyalty.redeemPoints} نقطة = {formatPrice(prog.loyalty.redeemValue)} خصم عند إتمام الطلب</p>
            </div>
          )}
        </div>
      )}

      <h2 className="mt-12 flex items-center gap-2 text-xl font-extrabold text-white"><Package size={20} className="text-[var(--accent)]" /> طلباتي</h2>
      {orders.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-[var(--card)] py-16 text-center">
          <p className="font-bold text-[var(--text-dim)]">لا توجد طلبات بعد</p>
          <Link href="/products" className="mt-5 inline-flex items-center gap-1 rounded-full bg-white px-8 py-3 font-bold text-black hover:bg-neutral-200">
            تسوق الآن <ChevronLeft size={16} />
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-2xl border border-[var(--border)] bg-white/[0.04] px-5 py-4">
              <Link href={`/order-success/${o.code}`} className="flex flex-wrap items-center gap-3 transition hover:opacity-80">
                <span className="font-extrabold text-white" dir="ltr">{o.code}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLS[o.status] || "bg-[var(--chip)] text-[var(--text-dim)]"}`}>{STATUS_LABEL[o.status] || o.status}</span>
                <span className="mr-auto text-sm text-[var(--text-dim)]">{formatDate(o.created_at)}</span>
                <span className="font-extrabold text-white">{formatPrice(o.total)}</span>
              </Link>
              <OrderTimeline code={o.code} status={o.status} />
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-14 flex items-center gap-2 text-xl font-extrabold text-white"><UserRound size={20} className="text-[var(--accent)]" /> بياناتي وعنوان التوصيل</h2>
      <p className="mt-1 text-sm text-[var(--text-dim)]">تُعبّأ تلقائياً عند إتمام الطلب.</p>
      <ProfileForm customer={customer} cities={cityNames} />

      <h2 id="password" className="mt-14 flex items-center gap-2 text-xl font-extrabold text-white"><KeyRound size={20} className="text-[var(--accent)]" /> كلمة المرور</h2>
      <PasswordForm mustChange={!!customer.must_change} />
      <div className="h-8" />
    </div>
  );
}
