import React from "react";
import { getDb } from "@/lib/db";
import { getProgram } from "@/lib/loyalty";
import CouponsManager from "@/components/admin/CouponsManager";
import ProgramPanel from "@/components/admin/ProgramPanel";
import type { Coupon } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function AdminCoupons() {
  const db = getDb();
  const coupons = db.prepare("SELECT c.*, cu.name AS customer_name FROM coupons c LEFT JOIN customers cu ON cu.id = c.customer_id ORDER BY c.id DESC").all() as (Coupon & { customer_name: string | null })[];
  const p = getProgram(db);
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">أكواد الخصم</h1>
      <p className="mt-1 text-sm text-neutral-500">أنشئ كوبونات تسويقية — الزبون يطبقها عند إتمام الطلب</p>
      <div className="mt-6">
        <ProgramPanel group="welcome" title="كوبون الترحيب للزبائن الجدد" desc="يُنشأ تلقائياً لكل زبون عند التسجيل، خاص به وحده ويظهر في صفحة حسابه."
          enabled={p.welcome.enabled}
          values={{ welcome_percent: p.welcome.percent, welcome_days: p.welcome.days, welcome_max_uses: p.welcome.maxUses }}
          fields={[
            { key: "welcome_percent", label: "نسبة الخصم %" },
            { key: "welcome_days", label: "مدة الصلاحية (أيام)" },
            { key: "welcome_max_uses", label: "أقصى عدد استخدامات" },
          ]} />
      </div>
      <CouponsManager coupons={coupons} />
    </div>
  );
}
