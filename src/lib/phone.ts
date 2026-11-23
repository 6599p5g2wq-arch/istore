// توحيد الأرقام الليبية: 09XXXXXXXX / 9XXXXXXXX / +2189XXXXXXXX / 002189XXXXXXXX  →  +2189XXXXXXXX
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizeLibyanPhone(input: string): string | null {
  let t = String(input || "").replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))).replace(/[\s\-().]/g, "");
  let d: string;
  if (t.startsWith("+")) d = t.slice(1);
  else if (t.startsWith("00")) d = t.slice(2);
  else d = t;
  if (!/^\d+$/.test(d)) return null;
  let rest: string;
  if (d.startsWith("218")) rest = d.slice(3);
  else if (d.startsWith("0")) rest = d.slice(1);
  else rest = d;
  if (rest.startsWith("0")) rest = rest.slice(1);
  return /^9\d{8}$/.test(rest) ? "+218" + rest : null;
}

/** رقم واتساب (أرقام فقط بدون +) من أي رقم محفوظ */
export function waNumber(phone: string): string {
  const n = normalizeLibyanPhone(phone);
  if (n) return n.slice(1);
  return String(phone || "").replace(/[^\d]/g, "").replace(/^0/, "218");
}
