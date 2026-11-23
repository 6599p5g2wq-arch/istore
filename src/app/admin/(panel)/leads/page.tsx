import React from "react";
import { getDb } from "@/lib/db";
import LeadsManager from "@/components/admin/LeadsManager";
import type { CartLead } from "@/lib/types";

export const dynamic = "force-dynamic";

const digits = (s: string) => s.replace(/\D/g, "");

export default function AdminLeads() {
  const db = getDb();
  const leads = db.prepare("SELECT * FROM cart_leads ORDER BY updated_at DESC").all() as CartLead[];
  const customers = db.prepare("SELECT id, name, phone FROM customers").all() as { id: number; name: string; phone: string }[];
  const byPhone = new Map(customers.map((c) => [digits(c.phone), c]));
  const recStmt = db.prepare("SELECT id, total FROM orders WHERE (REPLACE(phone, ' ', '') = ? OR phone = ?) AND status != 'cancelled' AND created_at > ? ORDER BY created_at ASC LIMIT 1");

  const enriched = leads.map((l) => {
    const cust = byPhone.get(digits(l.phone)) || null;
    const rec = recStmt.get(digits(l.phone), l.phone, l.updated_at) as { id: number; total: number } | undefined;
    return { ...l, customer_id: cust?.id ?? null, customer_name: cust?.name ?? null, recovered: !!rec, recovered_total: rec?.total ?? 0 };
  });

  const active = enriched.filter((l) => !l.recovered);
  const stats = {
    total: leads.length,
    value: active.reduce((s, l) => s + l.total, 0),
    recovered: enriched.filter((l) => l.recovered).length,
    recoveredValue: enriched.reduce((s, l) => s + (l.recovered ? l.recovered_total : 0), 0),
  };

  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">السلات المهجورة</h1>
      <p className="mt-1 text-sm text-neutral-500">زبائن بدأوا الطلب وأدخلوا هواتفهم ولم يكملوا — ذكّرهم برسالة واتساب</p>
      <LeadsManager leads={enriched} stats={stats} />
    </div>
  );
}
