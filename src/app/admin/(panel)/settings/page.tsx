import React from "react";
import { getSettings } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default function AdminSettings() {
  const s = getSettings();
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">إعدادات المتجر</h1>
      <p className="mt-1 text-sm text-neutral-500">كل نصوص المتجر ومعلوماته قابلة للتعديل من هنا</p>
      <SettingsForm settings={s} />
    </div>
  );
}
