export type PriceOpts = { pos: "after" | "before"; decimals: "auto" | "0" | "2"; sym2: string; rate2: number };
export const PRICE_DEFAULT: PriceOpts = { pos: "after", decimals: "auto", sym2: "", rate2: 0 };
let opts: PriceOpts = PRICE_DEFAULT;

/** خيارات عرض الأسعار (تُضبط من صفحة الإعدادات). تُستدعى من تخطيط المتجر على الخادم والمتصفح */
export function setPriceOpts(o: PriceOpts) { opts = o; }
export function priceOptsFrom(s: Record<string, string>): PriceOpts {
  const rate = Number(s.currency2_rate);
  return {
    pos: s.currency_pos === "before" ? "before" : "after",
    decimals: s.currency_decimals === "0" || s.currency_decimals === "2" ? s.currency_decimals : "auto",
    sym2: (s.currency2_symbol || "").trim(),
    rate2: Number.isFinite(rate) && rate > 0 ? rate : 0,
  };
}

function num(value: number, o: PriceOpts): string {
  const digits =
    o.decimals === "0" ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
    : o.decimals === "2" ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : { maximumFractionDigits: value % 1 === 0 ? 0 : 2 };
  return new Intl.NumberFormat("ar-LY", digits).format(value);
}

export function formatPrice(value: number, currency = "د.ل"): string {
  const n = num(value, opts);
  return opts.pos === "before" ? `${currency} ${n}` : `${n} ${currency}`;
}

/** السعر بالعملة الثانية (تقريبي) أو نص فارغ إن لم تُفعَّل */
export function formatSecondary(value: number): string {
  if (!opts.sym2 || !opts.rate2) return "";
  const v = value / opts.rate2;
  const n = new Intl.NumberFormat("ar-LY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  return opts.pos === "before" ? `≈ ${opts.sym2} ${n}` : `≈ ${n} ${opts.sym2}`;
}
export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-LY", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Tripoli" }).format(new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z"));
  } catch {
    return iso;
  }
}
