import React from "react";
import { redirect } from "next/navigation";
import { getControlSession } from "@/lib/control-auth";
import ControlLoginForm from "@/components/control/ControlLoginForm";
import { getSettings } from "@/lib/settings";
import { SlidersHorizontal } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "إعدادات الموقع - دخول" };

export default function ControlLoginPage() {
  if (getControlSession()) redirect("/control");
  const s = getSettings();
  return (
    <div className="grid min-h-screen place-items-center bg-neutral-950 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-black text-white"><SlidersHorizontal size={24} /></span>
          <h1 className="mt-4 text-2xl font-black">إعدادات موقع {s.store_name}</h1>
          <p className="mt-1 text-sm text-neutral-400">لوحة مستقلة لإدارة هوية ومحتوى الموقع</p>
        </div>
        <ControlLoginForm />
      </div>
    </div>
  );
}
