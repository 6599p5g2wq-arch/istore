import React from "react";
import { getSettings } from "@/lib/settings";
import { readAnnounce } from "@/lib/announcement";
import SiteSettings from "@/components/admin/SiteSettings";

export const dynamic = "force-dynamic";

export default function AdminSettings() {
  const s = getSettings();
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-black sm:text-3xl">الإعدادات</h1>
      <p className="mt-1 text-sm text-neutral-500">الشحن والعملة والأسعار وشريط الإعلانات</p>
      <SiteSettings values={{ currency: s.currency || "", currency_pos: s.currency_pos || "after", currency_decimals: s.currency_decimals || "auto", currency2_symbol: s.currency2_symbol || "", currency2_rate: s.currency2_rate || "", free_shipping_threshold: s.free_shipping_threshold || "0" }} announce={readAnnounce(s)} />
    </div>
  );
}
