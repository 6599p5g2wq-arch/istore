import React from "react";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import CheckoutForm from "@/components/store/CheckoutForm";
import { getSessionCustomer } from "@/lib/customer-auth";
import { getProgram } from "@/lib/loyalty";
import type { City } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إتمام الطلب" };

export default function CheckoutPage() {
  const db = getDb();
  const s = getSettings();
  const cities = db.prepare("SELECT * FROM cities WHERE active = 1 ORDER BY sort_order, name").all() as City[];
  const c = getSessionCustomer();
  const prog = getProgram(db);
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">إتمام الطلب</h1>
      <p className="mt-2 text-[var(--text-faint)]">الدفع عند الاستلام — املأ بياناتك وسنتواصل معك للتأكيد.</p>
      {!c && (
        <p className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-dim)]">
          يمكنك إتمام الطلب كزائر، أو <Link href="/account" className="font-bold text-[var(--accent)] hover:underline">سجّل دخولك</Link> لتعبئة بياناتك تلقائياً وتتبع طلباتك.
        </p>
      )}
      <CheckoutForm cities={cities} currency={s.currency} whatsapp={s.whatsapp} freeThreshold={Number(s.free_shipping_threshold || 0)} customer={c ? { name: c.name, phone: c.phone, city: c.city, address: c.address } : null} loyalty={c && prog.loyalty.enabled ? { points: c.points, redeemPoints: prog.loyalty.redeemPoints, redeemValue: prog.loyalty.redeemValue } : null} />
    </div>
  );
}
