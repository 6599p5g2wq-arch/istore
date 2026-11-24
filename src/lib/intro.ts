export type IntroChip = { icon: string; text: string };
export type IntroConfig = {
  enabled: boolean;
  title: string;
  pill: string;
  tagline: string;
  logo: string;
  opacity: number; // 0-60 (%)
  chips: IntroChip[];
  ctaText: string;
  ctaLink: string;
};

export const INTRO_ICONS: { key: string; label: string }[] = [
  { key: "truck", label: "شحن" },
  { key: "banknote", label: "دفع نقدي" },
  { key: "zap", label: "سرعة" },
  { key: "shield", label: "ضمان" },
  { key: "gift", label: "هدية" },
  { key: "percent", label: "خصم" },
  { key: "clock", label: "وقت" },
  { key: "star", label: "نجمة" },
  { key: "phone", label: "هاتف" },
  { key: "heart", label: "قلب" },
];

export const INTRO_KEYS = [
  "intro_enabled", "intro_title", "intro_pill", "intro_tagline", "intro_logo",
  "intro_logo_opacity", "intro_chips", "intro_cta_text", "intro_cta_link",
];

export function safeLink(v: string): string {
  const t = (v || "").trim();
  if (/^\/(?!\/)/.test(t) || /^https?:\/\//i.test(t)) return t;
  return "/products";
}

export function readIntro(s: Record<string, string>): IntroConfig {
  const cur = s.currency || "د.ل";
  const thr = Number(s.free_shipping_threshold || 0);
  let chips: IntroChip[] | null = null;
  if (s.intro_chips) {
    try {
      const a = JSON.parse(s.intro_chips);
      if (Array.isArray(a)) {
        chips = a
          .map((c) => ({ icon: String(c?.icon || "star"), text: String(c?.text || "").trim().slice(0, 40) }))
          .filter((c) => c.text)
          .slice(0, 6);
      }
    } catch {}
  }
  if (!chips) {
    chips = [
      ...(thr > 0 ? [{ icon: "truck", text: `شحن مجاني فوق ${thr.toLocaleString("en-US")} ${cur}` }] : []),
      { icon: "banknote", text: "الدفع عند الاستلام" },
      { icon: "zap", text: "توصيل خلال 24-72 ساعة" },
      { icon: "shield", text: "ضمان سنة" },
    ];
  }
  const op = Number(s.intro_logo_opacity);
  return {
    enabled: s.intro_enabled !== "0",
    title: (s.intro_title || "").trim() || s.store_name || "آي ستور",
    pill: s.intro_pill === undefined ? `تشكيلة ${new Date().getFullYear()} الجديدة` : s.intro_pill.trim().slice(0, 40),
    tagline: (s.intro_tagline || "").trim() || s.store_tagline || "",
    logo: s.intro_logo || "",
    opacity: Number.isFinite(op) && s.intro_logo_opacity !== undefined && s.intro_logo_opacity !== "" ? Math.min(60, Math.max(0, op)) : 18,
    chips,
    ctaText: Object.prototype.hasOwnProperty.call(s,"intro_cta_text") ? (s.intro_cta_text || "").trim() : "تسوق الآن",
    ctaLink: safeLink(s.intro_cta_link || "/products"),
  };
}
