"use client";
import React from "react";
import { BellRing, MessageCircle } from "lucide-react";
import DeleteButton from "./DeleteButton";
import { formatDate } from "@/lib/format";
import type { StockAlert } from "@/lib/types";

export default function StockAlertsManager({ alerts }: { alerts: (StockAlert & { stock: number })[] }) {
  return (
    <div className="mt-6 space-y-3">
      {alerts.length === 0 && <p className="rounded-3xl bg-white p-10 text-center text-sm text-neutral-400 shadow-sm">لا توجد طلبات إشعار حالياً</p>}
      {alerts.map((a) => (
        <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
          <span className={`grid h-11 w-11 place-items-center rounded-2xl ${a.notified ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}><BellRing size={19} /></span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold">{a.product_name}</p>
            <p className="text-xs text-neutral-500"><span dir="ltr">{a.contact}</span> — {formatDate(a.created_at)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${a.stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{a.stock > 0 ? "متوفر الآن" : "نافد"}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${a.notified ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>{a.notified ? "تم الإشعار" : "بانتظار التوفر"}</span>
          {!a.contact.includes("@") && (
            <a href={`https://wa.me/${a.contact.replace(/[^\d]/g, "").replace(/^0/, "218")}?text=${encodeURIComponent(`مرحباً، المنتج «${a.product_name}» أصبح متوفراً الآن في المتجر 🎉`)}`} target="_blank" rel="noreferrer" aria-label="تذكير واتساب"
              className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-500 hover:text-white"><MessageCircle size={15} /></a>
          )}
          <DeleteButton resource="stock-alerts" id={a.id} label={a.contact} />
        </div>
      ))}
    </div>
  );
}
