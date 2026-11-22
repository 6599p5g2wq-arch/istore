import React from "react";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import CheckoutForm from "@/components/store/CheckoutForm";
import type { City } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إتمام الطلب" };

export default function CheckoutPage() {
  const db = getDb();
  const s = getSettings();
  const cities = db.prepare("SELECT * FROM cities WHERE active = 1 ORDER BY sort_order, name").all() as City[];
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">إتمام الطلب</h1>
      <p className="mt-2 text-[var(--text-faint)]">الدفع عند الاستلام — املأ بياناتك وسنتواصل معك للتأكيد.</p>
      <CheckoutForm cities={cities} currency={s.currency} whatsapp={s.whatsapp} freeThreshold={Number(s.free_shipping_threshold || 0)} />
    </div>
  );
}
