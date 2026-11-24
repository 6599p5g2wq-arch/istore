import React from "react";
import SecuritySettings from "@/components/admin/SecuritySettings";
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
      <SecuritySettings panel="control"/><SettingsForm settings={{ ...s, telegram_bot_token: "", resend_api_key: "" }} telegramTokenSaved={!!s.telegram_bot_token} resendKeySaved={!!s.resend_api_key} />
    </div>
  );
}
