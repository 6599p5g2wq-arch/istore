"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, MessageCircle, CheckCircle2, ChevronDown, Phone, Trash2, Undo2 } from "lucide-react";
import DeleteButton from "./DeleteButton";
import { formatPrice, formatDate } from "@/lib/format";
import type { CartLead } from "@/lib/types";

type LeadItem = { name: string; qty: number; price: number };
export type EnrichedLead = CartLead & { customer_id: number | null; customer_name: string | null; recovered: boolean; recovered_total: number };
type Stats = { total: number; value: number; recovered: number; recoveredValue: number };

const chips = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "لم يُتابَع" },
  { key: "reminded", label: "تمت متابعته" },
  { key: "recovered", label: "مسترجَع" },
];

export default function LeadsManager({ leads, stats }: { leads: EnrichedLead[]; stats: Stats }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [chip, setChip] = useState("all");
  const [sort, setSort] = useState<"recent" | "value">("recent");
  const [openId, setOpenId] = useState<number | null>(null);
  const [cleaning, setCleaning] = useState(false);

  const filtered = leads
    .filter((l) => {
      if (chip === "pending" && (l.reminded || l.recovered)) return false;
      if (chip === "reminded" && (!l.reminded || l.recovered)) return false;
      if (chip === "recovered" && !l.recovered) return false;
      if (q && !l.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))) return false;
      return true;
    })
    .sort((a, b) => (sort === "value" ? b.total - a.total : b.updated_at.localeCompare(a.updated_at)));

  const setReminded = async (id: number, reminded: boolean) => {
    await fetch(`/api/admin/leads/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reminded }) });
    router.refresh();
  };

  const bulkDelete = async () => {
    if (!confirm("حذف كل السلات الأقدم من 30 يوماً؟")) return;
    setCleaning(true);
    const r = await fetch("/api/admin/leads?days=30", { method: "DELETE" });
    setCleaning(false);
    if (r.ok) router.refresh();
    else { const d = await r.json().catch(() => ({})); alert(d.error || "لا توجد سلات قديمة"); }
  };

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-neutral-500">سلات مهجورة</p><p className="mt-1 text-xl font-black">{stats.total}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-neutral-500">قيمتها الإجمالية</p><p className="mt-1 text-xl font-black">{formatPrice(stats.value)}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-neutral-500">سلات مسترجعة</p><p className="mt-1 text-xl font-black text-emerald-600">{stats.recovered}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-neutral-500">قيمة المسترجع</p><p className="mt-1 text-xl font-black text-emerald-600">{formatPrice(stats.recoveredValue)}</p></div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} dir="ltr" placeholder="بحث برقم الهاتف…"
          className="w-48 rounded-full border border-neutral-200 bg-white px-4 py-2 text-left text-sm outline-none focus:border-black" />
        {chips.map((ch) => (
          <button key={ch.key} onClick={() => setChip(ch.key)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${chip === ch.key ? "bg-black text-white" : "bg-white text-neutral-500 shadow-sm hover:text-black"}`}>
            {ch.label}
          </button>
        ))}
        <select value={sort} onChange={(e) => setSort(e.target.value as "recent" | "value")}
          className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-bold outline-none">
          <option value="recent">الأحدث</option>
          <option value="value">الأعلى قيمة</option>
        </select>
        <button onClick={bulkDelete} disabled={cleaning} className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-red-500 shadow-sm transition hover:bg-red-50 disabled:opacity-50">
          <Trash2 size={13} /> حذف الأقدم من 30 يوماً
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {filtered.length === 0 && <p className="rounded-3xl bg-white p-10 text-center text-sm text-neutral-400 shadow-sm">{leads.length === 0 ? "لا توجد سلات مهجورة — ممتاز 🎉" : "لا نتائج مطابقة"}</p>}
        {filtered.map((l) => {
          const items = JSON.parse(l.items || "[]") as LeadItem[];
          const itemsText = items.map((i) => `${i.name} × ${i.qty}`).join("، ");
          const waPhone = l.phone.replace(/[^\d]/g, "").replace(/^0/, "218");
          const msg = encodeURIComponent(`مرحباً${l.customer_name ? " " + l.customer_name : ""} 👋 لاحظنا أنك لم تكمل طلبك من متجرنا: ${itemsText} — الإجمالي ${formatPrice(l.total)}. هل نساعدك في إتمامه؟`);
          const open = openId === l.id;
          return (
            <div key={l.id} className={`rounded-3xl bg-white p-5 shadow-sm ${l.recovered ? "border border-emerald-200" : ""}`}>
              <div className="flex flex-wrap items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-100 text-orange-600"><ShoppingCart size={19} /></span>
                <button onClick={() => setOpenId(open ? null : l.id)} className="min-w-0 flex-1 text-right">
                  <p className="flex flex-wrap items-center gap-2 font-extrabold">
                    <span dir="ltr">{l.phone}</span>
                    {l.customer_name && <Link href={`/admin/customers/${l.customer_id}`} onClick={(e) => e.stopPropagation()} className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 hover:bg-sky-200">{l.customer_name}</Link>}
                    {l.recovered && <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">استُرجعت</span>}
                    {l.reminded === 1 && !l.recovered && <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-500"><CheckCircle2 size={11} /> تم التذكير</span>}
                  </p>
                  <p className="line-clamp-1 text-xs text-neutral-500">{itemsText}</p>
                  <p className="text-xs text-neutral-400">{formatDate(l.updated_at)} — {formatPrice(l.total)}</p>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <a href={`tel:${l.phone}`} title="اتصال" className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-black hover:text-black"><Phone size={15} /></a>
                  {!l.recovered && (
                    <a href={`https://wa.me/${waPhone}?text=${msg}`} target="_blank" rel="noreferrer" onClick={() => setReminded(l.id, true)}
                      className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-600">
                      <MessageCircle size={14} /> تذكير واتساب
                    </a>
                  )}
                  {l.reminded === 1 && !l.recovered && (
                    <button onClick={() => setReminded(l.id, false)} title="التراجع عن التذكير" className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-black hover:text-black"><Undo2 size={15} /></button>
                  )}
                  <button onClick={() => setOpenId(open ? null : l.id)} className={`grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-black hover:text-black ${open ? "rotate-180" : ""}`}><ChevronDown size={15} /></button>
                  <DeleteButton resource="leads" id={l.id} label={l.phone} />
                </div>
              </div>
              {open && (
                <div className="mt-4 rounded-2xl bg-neutral-50 p-4">
                  <table className="w-full text-sm">
                    <thead><tr className="text-right text-xs text-neutral-400"><th className="pb-1 font-bold">المنتج</th><th className="pb-1 font-bold">الكمية</th><th className="pb-1 font-bold">السعر</th><th className="pb-1 font-bold">الإجمالي</th></tr></thead>
                    <tbody>
                      {items.map((i, idx) => (
                        <tr key={idx} className="border-t border-neutral-200/60">
                          <td className="py-1.5 font-bold">{i.name}</td>
                          <td className="py-1.5">{i.qty}</td>
                          <td className="py-1.5">{formatPrice(i.price)}</td>
                          <td className="py-1.5 font-bold">{formatPrice(i.price * i.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
