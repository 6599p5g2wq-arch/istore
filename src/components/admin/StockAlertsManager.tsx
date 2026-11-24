"use client";
import React, { useMemo, useState } from "react";
import { BellRing, MessageCircle, Mail, Phone, Trash2, Loader2, ExternalLink } from "lucide-react";
import DeleteButton from "./DeleteButton";
import { formatDate } from "@/lib/format";
import type { StockAlert } from "@/lib/types";

type Alert = StockAlert & { stock: number };

export default function StockAlertsManager({ alerts: initial, siteUrl }: { alerts: Alert[]; siteUrl: string }) {
  const [alerts, setAlerts] = useState(initial);
  const [chip, setChip] = useState<"all" | "waiting" | "notified">("all");
  const [q, setQ] = useState("");
  const [cleaning, setCleaning] = useState(false);

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (chip === "waiting" && a.notified) return false;
      if (chip === "notified" && !a.notified) return false;
      if (q) {
        const t = q.toLowerCase();
        if (!(a.product_name || "").toLowerCase().includes(t) && !a.contact.toLowerCase().includes(t)) return false;
      }
      return true;
    });
  }, [alerts, chip, q]);

  const groups = useMemo(() => {
    const m = new Map<number, { name: string; slug: string; stock: number; rows: Alert[] }>();
    for (const a of filtered) {
      const g = m.get(a.product_id) || { name: a.product_name || "", slug: a.slug || "", stock: a.stock, rows: [] };
      g.rows.push(a);
      m.set(a.product_id, g);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const notifiedCount = alerts.filter((a) => a.notified).length;

  const cleanup = async () => {
    if (!confirm(`حذف ${notifiedCount} طلب مُشعَر؟`)) return;
    setCleaning(true);
    const r = await fetch("/api/admin/stock-alerts/cleanup", { method: "POST" });
    if (r.ok) setAlerts((cur) => cur.filter((a) => !a.notified));
    setCleaning(false);
  };

  const chips: [typeof chip, string][] = [["all", "الكل"], ["waiting", "بانتظار"], ["notified", "تم الإشعار"]];

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالمنتج أو جهة الاتصال…" className="w-56 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm outline-none focus:border-black" />
        {chips.map(([k, label]) => (
          <button key={k} onClick={() => setChip(k)} className={`rounded-full px-3 py-2 text-xs font-bold transition ${chip === k ? "bg-black text-white" : "bg-white text-neutral-500"}`}>{label}</button>
        ))}
        <div className="mr-auto">
          {notifiedCount > 0 && (
            <button onClick={cleanup} disabled={cleaning} className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-600 transition hover:border-red-300 hover:text-red-600 disabled:opacity-60">
              {cleaning ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} حذف المُشعَرين ({notifiedCount})
            </button>
          )}
        </div>
      </div>

      {groups.length === 0 && <p className="mt-4 rounded-3xl bg-white p-10 text-center text-sm text-neutral-400 shadow-sm">{alerts.length === 0 ? "لا توجد طلبات إشعار حالياً" : "لا نتائج مطابقة"}</p>}

      <div className="mt-4 space-y-4">
        {groups.map(([pid, g]) => {
          const waiting = g.rows.filter((r) => !r.notified).length;
          const productUrl = siteUrl && g.slug ? `${siteUrl}/product/${g.slug}` : "";
          return (
            <div key={pid} className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 pb-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-600"><BellRing size={16} /></span>
                <a href={g.slug ? `/product/${g.slug}` : "#"} target="_blank" className="flex items-center gap-1 font-extrabold hover:underline">{g.name} <ExternalLink size={12} className="text-neutral-400" /></a>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${g.stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{g.stock > 0 ? "متوفر الآن" : "نافد"}</span>
                {waiting > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">{waiting} بانتظار</span>}
              </div>
              <div className="mt-3 space-y-2">
                {g.rows.map((a) => {
                  const isEmail = a.contact.includes("@");
                  const wa = !isEmail
                    ? `https://wa.me/${a.contact.replace(/[^\d]/g, "").replace(/^0/, "218")}?text=${encodeURIComponent(`مرحباً، المنتج «${g.name}» أصبح متوفراً الآن في المتجر 🎉${productUrl ? `\n${productUrl}` : ""}`)}`
                    : "";
                  return (
                    <div key={a.id} className={`flex flex-wrap items-center gap-3 rounded-2xl px-3 py-2.5 ${a.notified ? "opacity-60" : "bg-neutral-50"}`}>
                      {isEmail ? <Mail size={15} className="shrink-0 text-sky-500" /> : <Phone size={15} className="shrink-0 text-emerald-500" />}
                      <span dir="ltr" className="min-w-0 flex-1 truncate text-sm font-bold">{a.contact}</span>
                      <span className="text-xs text-neutral-400">{formatDate(a.created_at)}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${a.notified ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-500"}`}>{a.notified ? "تم الإشعار" : "بانتظار التوفر"}</span>
                      {!isEmail && (
                        <a href={wa} target="_blank" rel="noreferrer" aria-label="تذكير واتساب" title="تذكير واتساب برسالة فيها رابط المنتج"
                          className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-500 hover:text-white"><MessageCircle size={14} /></a>
                      )}
                      <DeleteButton resource="stock-alerts" id={a.id} label={a.contact} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
