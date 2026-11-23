"use client";
import { setPriceOpts, type PriceOpts } from "@/lib/format";

// يضبط خيارات عرض الأسعار قبل رسم بقية الصفحة (على الخادم وفي المتصفح)
export default function PriceFormatInit({ opts }: { opts: PriceOpts }) {
  setPriceOpts(opts);
  return null;
}
