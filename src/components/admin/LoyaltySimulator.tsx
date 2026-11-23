"use client";
import React, { useState } from "react";
import { Calculator } from "lucide-react";
import { formatPrice } from "@/lib/format";

export default function LoyaltySimulator({ perLyd, redeemPoints, redeemValue }: { perLyd: number; redeemPoints: number; redeemValue: number }) {
  const [amount, setAmount] = useState("500");
  const a = Number(amount) || 0;
  const earned = Math.floor(a * perLyd);
  const worth = Math.floor(earned / redeemPoints) * redeemValue;
  return (
    <div className="rounded-3xl bg-neutral-50 p-5">
      <p className="flex items-center gap-2 text-sm font-extrabold"><Calculator size={15} /> جرّب الحسبة</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span>طلب بقيمة</span>
        <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} dir="ltr"
          className="w-28 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-center outline-none focus:border-black" />
        <span>د.ل</span>
        <span className="font-black text-emerald-700">يكسب الزبون {earned.toLocaleString("en")} نقطة</span>
        <span className="text-neutral-400">=</span>
        <span className="font-black">خصم {formatPrice(worth)}</span>
      </div>
      <p className="mt-2 text-xs text-neutral-500">كل {redeemPoints.toLocaleString("en")} نقطة = {formatPrice(redeemValue)} عند الاستبدال. الحسبة للتوضيح فقط ولا تغيّر أي إعداد.</p>
    </div>
  );
}
