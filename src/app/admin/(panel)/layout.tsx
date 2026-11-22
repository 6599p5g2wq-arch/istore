import React from "react";
import { redirect } from "next/navigation";
import { getSessionAdmin } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = getSessionAdmin();
  if (!admin) redirect("/admin/login");
  const s = getSettings();
  return (
    <div className="light-scope min-h-screen bg-[#f5f5f7]">
      <AdminSidebar storeName={s.store_name} username={admin.username} />
      <div className="lg:mr-64">
        <main className="mx-auto max-w-6xl p-4 pt-20 sm:p-8 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}
