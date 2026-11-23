import React from "react";
import { Truck, ShieldCheck, BadgeCheck, RefreshCcw, Headset, Banknote, Zap, Gift, Percent, Clock, Star, Phone, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MarqueeItem } from "@/lib/marquee";

const ICONS: Record<string, LucideIcon> = {
  truck: Truck, banknote: Banknote, badge: BadgeCheck, refresh: RefreshCcw, shield: ShieldCheck, headset: Headset,
  zap: Zap, gift: Gift, percent: Percent, clock: Clock, star: Star, phone: Phone, heart: Heart,
};

export default function Marquee({ items }: { items: MarqueeItem[] }) {
  if (!items.length) return null;
  // كل نصف يجب أن يكون أعرض من أوسع شاشة كي لا تظهر فراغات أثناء الحركة
  const half = Array.from({ length: Math.max(2, Math.ceil(12 / items.length)) }, () => items).flat();
  return (
    <div className="mt-10 overflow-hidden border-y border-[var(--border)] bg-[var(--surface)] py-4" dir="ltr">
      <div className="animate-marquee flex w-max gap-12">
        {[0, 1].map((h) => (
          <div key={h} className="flex gap-12">
            {half.map((it, i) => {
              const Icon = ICONS[it.icon] || Star;
              return (
                <span key={`${h}-${i}`} className="flex items-center gap-2.5 whitespace-nowrap text-sm font-bold text-[var(--text-dim)]" dir="rtl">
                  <Icon size={18} className="text-[var(--accent)]" />
                  {it.text}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
