import React from "react";
import { getSettings } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "إعدادات الموقع" };

export default function ControlPanelPage() {
  const s = getSettings();
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">إعدادات الموقع</h1>
      <p className="mt-1 text-sm text-neutral-500">كل ما يخص هوية الموقع ومعلوماته يتعدل من هنا ويتطبق على المتجر مباشرة</p>
      <SettingsForm settings={s} />
    </div>
  );
}
