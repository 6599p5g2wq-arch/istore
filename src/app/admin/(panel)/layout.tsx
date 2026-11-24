import React from "react";
import SessionGuard from "@/components/admin/SessionGuard";
import {authConfig} from "@/lib/security";
import { redirect } from "next/navigation";
import { getSessionAdmin } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getSettings } from "@/lib/settings";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = getSessionAdmin();
  if (!admin) redirect("/admin/login");
  const s = getSettings();
  const db = getDb();
  const newOrders = (db.prepare("SELECT COUNT(*) c FROM orders WHERE status = 'new'").get() as { c: number }).c;
  const lowStock = (db.prepare("SELECT COUNT(*) c FROM products WHERE active = 1 AND stock <= 5").get() as { c: number }).c;
  const lowReviews = (db.prepare("SELECT COUNT(*) c FROM reviews WHERE approved = 1 AND rating <= 2").get() as { c: number }).c;
  const waitingAlerts = (db.prepare("SELECT COUNT(*) c FROM stock_alerts WHERE notified = 0").get() as { c: number }).c;
  return (
    <div className="light-scope min-h-screen bg-[#f5f5f7]"><SessionGuard panel="admin" idleMinutes={authConfig().idleMinutes}/>
      <AdminSidebar storeName={s.store_name} username={admin.username} newOrders={newOrders} lowStock={lowStock} lowReviews={lowReviews} waitingAlerts={waitingAlerts} />
      <div className="lg:mr-64">
        <main className="mx-auto max-w-6xl p-4 pt-20 sm:p-8 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}
