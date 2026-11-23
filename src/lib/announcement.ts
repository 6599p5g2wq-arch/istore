// شريط الإعلانات: الإعدادات تُخزَّن كـ JSON في مفتاح announce_config
export type AnnounceMessage = { text: string; link: string };
export type AnnounceEffect = "fade" | "slide" | "vertical" | "marquee";
export const EFFECTS: { value: AnnounceEffect; label: string }[] = [
  { value: "fade", label: "تلاشي (الحالي)" },
  { value: "slide", label: "انزلاق جانبي ناعم" },
  { value: "vertical", label: "انزلاق عمودي" },
  { value: "marquee", label: "شريط متحرك مستمر (Ticker)" },
];

export type AnnounceConfig = {
  enabled: boolean;
  messages: AnnounceMessage[];
  interval: number; // ثوانٍ بين الرسائل
  bg: string;
  color: string;
  start: string; // yyyy-mm-ddThh:mm بتوقيت ليبيا (UTC+2) أو فارغ
  end: string;
  countdown: boolean;
  closable: boolean;
  effect: AnnounceEffect; // طريقة العرض
};

export const ANNOUNCE_DEFAULT: AnnounceConfig = {
  enabled: true, messages: [], interval: 5, bg: "#000000", color: "#ffffff", start: "", end: "", countdown: false, closable: false, effect: "fade",
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function sanitizeAnnounce(raw: unknown): AnnounceConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const msgs = Array.isArray(r.messages) ? r.messages : [];
  const messages: AnnounceMessage[] = [];
  for (const m of msgs.slice(0, 10)) {
    const mm = (m && typeof m === "object" ? m : {}) as Record<string, unknown>;
    const text = String(mm.text ?? "").trim().slice(0, 200);
    let link = String(mm.link ?? "").trim().slice(0, 500);
    // روابط داخلية أو http(s) فقط
    if (link && !(link.startsWith("/") && !link.startsWith("//")) && !/^https?:\/\//i.test(link)) link = "";
    if (text) messages.push({ text, link });
  }
  const interval = Math.min(30, Math.max(2, Math.round(Number(r.interval) || 5)));
  return {
    enabled: r.enabled !== false && r.enabled !== 0 && r.enabled !== "0",
    messages,
    interval,
    bg: HEX.test(String(r.bg)) ? String(r.bg) : "#000000",
    color: HEX.test(String(r.color)) ? String(r.color) : "#ffffff",
    start: DATE.test(String(r.start)) ? String(r.start) : "",
    end: DATE.test(String(r.end)) ? String(r.end) : "",
    countdown: !!r.countdown && r.countdown !== "0",
    closable: !!r.closable && r.closable !== "0",
    effect: (EFFECTS.map((e) => e.value) as string[]).includes(String(r.effect)) ? (String(r.effect) as AnnounceEffect) : "fade",
  };
}

/** يقرأ الإعداد؛ وإن لم يُحفظ بعد يرجع إلى النص القديم "announcement" كرسالة وحيدة */
export function readAnnounce(s: Record<string, string>): AnnounceConfig {
  if (s.announce_config) {
    try { return sanitizeAnnounce(JSON.parse(s.announce_config)); } catch { /* يرجع للقديم */ }
  }
  return { ...ANNOUNCE_DEFAULT, messages: s.announcement ? [{ text: s.announcement, link: "" }] : [] };
}

// توقيت ليبيا ثابت UTC+2 (بلا توقيت صيفي)
export function toMs(local: string): number | null {
  if (!local) return null;
  const t = Date.parse(local + ":00+02:00");
  return Number.isFinite(t) ? t : null;
}

export function isActive(c: AnnounceConfig, now = Date.now()): boolean {
  if (!c.enabled || c.messages.length === 0) return false;
  const st = toMs(c.start), en = toMs(c.end);
  if (st !== null && now < st) return false;
  if (en !== null && now > en) return false;
  return true;
}

/** نص أول رسالة فعالة لتوافق التطبيقات القديمة (مفتاح announcement) */
export function legacyText(c: AnnounceConfig): string {
  return isActive(c) ? c.messages[0].text : "";
}
