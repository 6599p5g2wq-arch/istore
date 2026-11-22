import React from "react";
import { getDb } from "@/lib/db";
import CouponsManager from "@/components/admin/CouponsManager";
import type { Coupon } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function AdminCoupons() {
  const db = getDb();
  const coupons = db.prepare("SELECT * FROM coupons ORDER BY id DESC").all() as Coupon[];
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">أكواد الخصم</h1>
      <p className="mt-1 text-sm text-neutral-500">أنشئ كوبونات تسويقية — الزبون يطبقها عند إتمام الطلب</p>
      <CouponsManager coupons={coupons} />
    </div>
  );
}
