import React from "react";
import { getDb } from "@/lib/db";
import BannersManager from "@/components/admin/BannersManager";
import type { Banner } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function AdminBanners() {
  const banners = getDb().prepare("SELECT * FROM banners ORDER BY sort_order").all() as Banner[];
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">البنرات الترويجية</h1>
      <p className="mt-1 text-sm text-neutral-500">بطاقات العروض بين أقسام الصفحة الرئيسية (أول 3 تظهر)</p>
      <BannersManager banners={banners} />
    </div>
  );
}
