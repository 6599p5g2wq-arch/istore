"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, MessageCircle, CheckCircle2 } from "lucide-react";
import DeleteButton from "./DeleteButton";
import { formatPrice, formatDate } from "@/lib/format";
import type { CartLead } from "@/lib/types";

type LeadItem = { name: string; qty: number; price: number };

export default function LeadsManager({ leads }: { leads: CartLead[] }) {
  const router = useRouter();

  const markReminded = async (id: number) => {
    await fetch(`/api/admin/leads/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reminded: true }) });
    router.refresh();
  };

  return (
    <div className="mt-6 space-y-3">
      {leads.length === 0 && <p className="rounded-3xl bg-white p-10 text-center text-sm text-neutral-400 shadow-sm">لا توجد سلات مهجورة — ممتاز 🎉</p>}
      {leads.map((l) => {
        const items = JSON.parse(l.items || "[]") as LeadItem[];
        const itemsText = items.map((i) => `${i.name} × ${i.qty}`).join("، ");
        const waPhone = l.phone.replace(/[^\d]/g, "").replace(/^0/, "218");
        const msg = encodeURIComponent(`مرحباً 👋 لاحظنا أنك لم تكمل طلبك من متجرنا: ${itemsText} — الإجمالي ${formatPrice(l.total)}. هل نساعدك في إتمامه؟`);
        return (
          <div key={l.id} className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 text-orange-600"><ShoppingCart size={19} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold" dir="ltr">{l.phone}</p>
              <p className="line-clamp-1 text-xs text-neutral-500">{itemsText}</p>
              <p className="text-xs text-neutral-400">{formatDate(l.updated_at)} — {formatPrice(l.total)}</p>
            </div>
            {l.reminded ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 size={13} /> تم التذكير</span>
            ) : (
              <a href={`https://wa.me/${waPhone}?text=${msg}`} target="_blank" rel="noreferrer" onClick={() => markReminded(l.id)}
                className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-600">
                <MessageCircle size={14} /> تذكير واتساب
              </a>
            )}
            <DeleteButton resource="leads" id={l.id} label={l.phone} />
          </div>
        );
      })}
    </div>
  );
}
