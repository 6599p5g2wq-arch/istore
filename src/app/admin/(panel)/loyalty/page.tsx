import React from "react";
import { getDb } from "@/lib/db";
import { getProgram } from "@/lib/loyalty";
import ProgramPanel from "@/components/admin/ProgramPanel";

export const dynamic = "force-dynamic";

export default function AdminLoyalty() {
  const p = getProgram(getDb());
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-black sm:text-3xl">الولاء و VIP</h1>
      <p className="mt-1 text-sm text-neutral-500">نقاط على الطلبات المكتملة يستبدلها الزبون بخصم، وشارة VIP لأفضل الزبائن</p>
      <div className="mt-6 space-y-5">
        <ProgramPanel group="loyalty" title="نقاط الولاء" desc="تُمنح النقاط عند تحويل الطلب إلى «تم التوصيل»، ويستبدلها الزبون عند إتمام الطلب."
          enabled={p.loyalty.enabled}
          values={{ loyalty_per_lyd: p.loyalty.perLyd, loyalty_redeem_points: p.loyalty.redeemPoints, loyalty_redeem_value: p.loyalty.redeemValue }}
          fields={[
            { key: "loyalty_per_lyd", label: "نقاط لكل 1 د.ل", hint: "الافتراضي: 1", step: 0.01 },
            { key: "loyalty_redeem_points", label: "عدد النقاط للاستبدال", hint: "الافتراضي: 100" },
            { key: "loyalty_redeem_value", label: "قيمة الخصم (د.ل)", hint: "الافتراضي: 5 د.ل مقابل 100 نقطة", step: 0.01 },
          ]} />
        <ProgramPanel group="vip" title="زبون VIP" desc="يُوسم الزبون تلقائياً عند بلوغ حد الإنفاق (طلبات غير ملغاة)، ويمكنك تفعيله أو إلغاءه يدوياً من صفحة الزبون."
          enabled={p.vip.enabled}
          values={{ vip_threshold: p.vip.threshold }}
          fields={[{ key: "vip_threshold", label: "حد الإنفاق (د.ل)", hint: "الافتراضي: 2000" }]} />
      </div>
    </div>
  );
}
