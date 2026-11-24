import React from "react";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import CitiesManager from "@/components/admin/CitiesManager";
import type { City } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function AdminShipping() {
  const db = getDb();
  const s = getSettings();
  const cities = db.prepare("SELECT * FROM cities ORDER BY sort_order, name").all() as City[];
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">التوصيل والمدن</h1>
      <p className="mt-1 text-sm text-neutral-500">إدارة المدن والرسوم والترتيب وحد الشحن المجاني</p>
      <CitiesManager cities={cities} threshold={s.free_shipping_threshold || "0"} currency={s.currency} />
    </div>
  );
}
