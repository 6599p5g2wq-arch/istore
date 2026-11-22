import React from "react";
import { Truck, ShieldCheck, BadgeCheck, RefreshCcw, Headset, Banknote } from "lucide-react";

const ITEMS = [
  { icon: Truck, text: "توصيل لكل المدن الليبية" },
  { icon: Banknote, text: "الدفع عند الاستلام" },
  { icon: BadgeCheck, text: "منتجات أصلية 100%" },
  { icon: RefreshCcw, text: "استبدال خلال 7 أيام" },
  { icon: ShieldCheck, text: "ضمان على الأجهزة" },
  { icon: Headset, text: "دعم على مدار الساعة" },
];

export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="mt-10 overflow-hidden border-y border-neutral-100 bg-[#f5f5f7] py-4" dir="ltr">
      <div className="animate-marquee flex w-max gap-12">
        {[0, 1].map((half) => (
          <div key={half} className="flex gap-12">
            {row.map((it, i) => (
              <span key={`${half}-${i}`} className="flex items-center gap-2.5 whitespace-nowrap text-sm font-bold text-neutral-600" dir="rtl">
                <it.icon size={18} className="text-[var(--accent)]" />
                {it.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
