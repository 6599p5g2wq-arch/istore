import React from "react";
import { getDb } from "@/lib/db";
import StockAlertsManager from "@/components/admin/StockAlertsManager";
import type { StockAlert } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function AdminStockAlerts() {
  const db = getDb();
  const alerts = db.prepare(
    `SELECT sa.*, p.name AS product_name, p.stock FROM stock_alerts sa JOIN products p ON p.id = sa.product_id ORDER BY sa.notified ASC, sa.id DESC`
  ).all() as (StockAlert & { stock: number })[];
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">طلبات إشعار التوفر</h1>
      <p className="mt-1 text-sm text-neutral-500">زبائن سجلوا ليُعلَموا عند توفر منتج نافد — يُرسل بريد تلقائياً لمن ترك إيميله عند إعادة التخزين</p>
      <StockAlertsManager alerts={alerts} />
    </div>
  );
}
