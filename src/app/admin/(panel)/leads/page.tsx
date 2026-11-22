import React from "react";
import { getDb } from "@/lib/db";
import LeadsManager from "@/components/admin/LeadsManager";
import type { CartLead } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function AdminLeads() {
  const db = getDb();
  const leads = db.prepare("SELECT * FROM cart_leads ORDER BY updated_at DESC").all() as CartLead[];
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">السلات المهجورة</h1>
      <p className="mt-1 text-sm text-neutral-500">زبائن بدأوا الطلب وأدخلوا هواتفهم ولم يكملوا — ذكّرهم برسالة واتساب</p>
      <LeadsManager leads={leads} />
    </div>
  );
}
