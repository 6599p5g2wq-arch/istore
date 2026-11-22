export function formatPrice(value: number, currency = "د.ل"): string {
  const n = new Intl.NumberFormat("ar-LY", { maximumFractionDigits: value % 1 === 0 ? 0 : 2 }).format(value);
  return `${n} ${currency}`;
}
export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-LY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z"));
  } catch {
    return iso;
  }
}
