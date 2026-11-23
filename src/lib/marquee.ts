export type MarqueeItem = { icon: string; text: string };

export const MARQUEE_ICONS: { key: string; label: string }[] = [
  { key: "truck", label: "شحن" },
  { key: "banknote", label: "دفع نقدي" },
  { key: "badge", label: "أصلي" },
  { key: "refresh", label: "استبدال" },
  { key: "shield", label: "ضمان" },
  { key: "headset", label: "دعم" },
  { key: "zap", label: "سرعة" },
  { key: "gift", label: "هدية" },
  { key: "percent", label: "خصم" },
  { key: "clock", label: "وقت" },
  { key: "star", label: "نجمة" },
  { key: "phone", label: "هاتف" },
  { key: "heart", label: "قلب" },
];

export const MARQUEE_DEFAULTS: MarqueeItem[] = [
  { icon: "truck", text: "توصيل لكل المدن الليبية" },
  { icon: "banknote", text: "الدفع عند الاستلام" },
  { icon: "badge", text: "منتجات أصلية 100%" },
  { icon: "refresh", text: "استبدال خلال 7 أيام" },
  { icon: "shield", text: "ضمان على الأجهزة" },
  { icon: "headset", text: "دعم على مدار الساعة" },
];

export function sanitizeItems(a: unknown, icons: { key: string }[], max = 6): MarqueeItem[] {
  if (!Array.isArray(a)) return [];
  const ok = new Set(icons.map((i) => i.key));
  const out: MarqueeItem[] = [];
  for (const c of a) {
    const text = String((c as { text?: unknown })?.text ?? "").trim().slice(0, 40);
    if (!text) continue;
    const ic = String((c as { icon?: unknown })?.icon ?? "star");
    out.push({ icon: ok.has(ic) ? ic : "star", text });
    if (out.length >= max) break;
  }
  return out;
}

export function readMarquee(s: Record<string, string>): { enabled: boolean; items: MarqueeItem[] } {
  let items: MarqueeItem[] = MARQUEE_DEFAULTS;
  if (s.marquee_items) {
    try { items = sanitizeItems(JSON.parse(s.marquee_items), MARQUEE_ICONS); } catch {}
  }
  return { enabled: s.marquee_enabled !== "0" && items.length > 0, items };
}
