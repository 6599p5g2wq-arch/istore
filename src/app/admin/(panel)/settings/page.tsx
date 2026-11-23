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
      <p className="mt-1 text-sm text-neutral-500">شريط الإعلانات والعملة</p>
      <SiteSettings currency={s.currency || ""} announce={readAnnounce(s)} />
    </div>
  );
}
