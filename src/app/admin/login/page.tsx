import React from "react";
import { redirect } from "next/navigation";
import { getSessionAdmin } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";
import { getSettings } from "@/lib/settings";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  if (getSessionAdmin()) redirect("/admin");
  const s = getSettings();
  return (
    <div className="grid min-h-screen place-items-center bg-neutral-950 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-black text-white"><Lock size={24} /></span>
          <h1 className="mt-4 text-2xl font-black">لوحة تحكم {s.store_name}</h1>
          <p className="mt-1 text-sm text-neutral-400">سجل دخولك لإدارة المتجر</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
