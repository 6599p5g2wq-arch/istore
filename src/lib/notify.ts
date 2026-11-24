/**
 * بريد المتجر عبر Resend. يُقرأ الإعداد من قاعدة البيانات أولاً (حقول /control)
 * ثم من متغيرات البيئة كبديل. لا يفعل شيئاً بدون مفتاح، حتى لا يتعطل الطلب.
 */
import { getSetting } from "@/lib/settings";

export type OrderNotice = {
  code: string;
  customer: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  couponCode: string;
  deliveryFee: number;
  total: number;
  currency: string;
};

function mailKey(): string {
  return getSetting("resend_api_key", "") || process.env.RESEND_API_KEY || "";
}

function mailFrom(): string {
  return getSetting("resend_from", "") || process.env.RESEND_FROM || "CAVEN STORE <onboarding@resend.dev>";
}

function notifyTo(): string {
  return getSetting("notify_email", "") || getSetting("email", "") || process.env.NOTIFY_EMAIL || "";
}

const esc = (v: string) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const money = (n: number, currency: string) => `${n.toLocaleString("en-US")} ${currency}`;

async function resendSend(to: string, subject: string, html: string): Promise<boolean> {
  const key = mailKey();
  if (!key || !to) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: mailFrom(), to: [to], subject, html }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[notify] Resend failed (${res.status}): ${detail.slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[notify] Resend error:", e);
    return false;
  }
}

function shell(title: string, inner: string): string {
  const store = getSetting("store_name", "CAVEN STORE");
  return `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:560px;margin:auto;background:#f7f7f9;padding:24px;border-radius:16px">
  <div style="text-align:center;padding:16px 0 20px"><span style="font-size:22px;font-weight:900;color:#111">${esc(store)}</span></div>
  <div style="background:#fff;border-radius:14px;padding:20px">
    <h2 style="margin:0 0 12px;font-size:18px">${title}</h2>
    ${inner}
  </div>
  <p style="color:#999;font-size:11px;text-align:center;margin-top:14px">هذا البريد من ${esc(store)} — لا ترد على هذه الرسالة.</p>
</div>`;
}

function itemsTable(o: OrderNotice): string {
  const rows = o.items
    .map(
      (it) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${esc(it.name)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${it.qty}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:left">${money(it.price * it.qty, o.currency)}</td></tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse">
    <tr style="background:#111;color:#fff"><td style="padding:8px 12px">المنتج</td><td style="padding:8px 12px;text-align:center">الكمية</td><td style="padding:8px 12px;text-align:left">السعر</td></tr>
    ${rows}
    <tr><td style="padding:8px 12px;color:#888">المجموع الفرعي</td><td></td><td style="padding:8px 12px;text-align:left">${money(o.subtotal, o.currency)}</td></tr>
    ${o.discount > 0 ? `<tr><td style="padding:8px 12px;color:#16a34a">الخصم${o.couponCode ? ` (${esc(o.couponCode)})` : ""}</td><td></td><td style="padding:8px 12px;text-align:left;color:#16a34a">- ${money(o.discount, o.currency)}</td></tr>` : ""}
    <tr><td style="padding:8px 12px;color:#888">التوصيل</td><td></td><td style="padding:8px 12px;text-align:left">${o.deliveryFee === 0 ? "مجاني" : money(o.deliveryFee, o.currency)}</td></tr>
    <tr><td style="padding:10px 12px;font-weight:bold;font-size:16px">الإجمالي</td><td></td><td style="padding:10px 12px;font-weight:bold;font-size:16px;text-align:left;color:#0071e3">${money(o.total, o.currency)}</td></tr>
  </table>`;
}

function customerBlock(o: OrderNotice): string {
  return `<table style="width:100%;border-collapse:collapse;margin-bottom:12px">
    <tr><td style="padding:4px 0;color:#888;width:90px">الزبون</td><td style="padding:4px 0;font-weight:bold">${esc(o.customer)}</td></tr>
    <tr><td style="padding:4px 0;color:#888">الهاتف</td><td style="padding:4px 0;font-weight:bold" dir="ltr">${esc(o.phone)}</td></tr>
    <tr><td style="padding:4px 0;color:#888">المدينة</td><td style="padding:4px 0">${esc(o.city)}</td></tr>
    ${o.address ? `<tr><td style="padding:4px 0;color:#888">العنوان</td><td style="padding:4px 0">${esc(o.address)}</td></tr>` : ""}
    ${o.notes ? `<tr><td style="padding:4px 0;color:#888">ملاحظات</td><td style="padding:4px 0">${esc(o.notes)}</td></tr>` : ""}
  </table>`;
}

/** إشعار طلب جديد لبريد المتجر (بريد التواصل أو الحقل المخصص). */
export async function notifyNewOrder(o: OrderNotice): Promise<void> {
  const to = notifyTo();
  if (!to) return;
  await resendSend(to, `🛒 طلب جديد ${o.code} — ${money(o.total, o.currency)} — ${esc(o.customer)}`,
    shell(`طلب جديد: <span dir="ltr">${o.code}</span>`, customerBlock(o) + itemsTable(o) +
      `<p style="color:#999;font-size:12px;margin-top:14px">الدفع عند الاستلام — تواصل مع الزبون لتأكيد الطلب قبل الشحن.</p>`));
}

/** تأكيد الطلب للزبون عندما ترك بريده. */
export async function sendOrderConfirmation(to: string, o: OrderNotice): Promise<boolean> {
  return resendSend(to, `تم استلام طلبك ${o.code} ✅`,
    shell(`شكراً لك، ${esc(o.customer)}! تم استلام طلبك`, `
    <p>رقم طلبك: <b dir="ltr">${o.code}</b> — احتفظ به لتتبع الطلب.</p>
    <p>سنتواصل معك على رقمك <b dir="ltr">${esc(o.phone)}</b> لتأكيد الطلب قبل الشحن.</p>
    ${itemsTable(o)}
    <p style="color:#999;font-size:12px;margin-top:14px">الدفع عند الاستلام.</p>`));
}

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

/** إشعار الزبون بتغيّر حالة طلبه. */
export async function sendOrderStatusEmail(to: string, o: OrderNotice, status: string): Promise<boolean> {
  const label = STATUS_LABELS[status] || status;
  return resendSend(to, `تحديث طلبك ${o.code}: ${label}`,
    shell(`تحديث على طلبك <span dir="ltr">${o.code}</span>`, `
    <p>مرحباً ${esc(o.customer)}،</p>
    <p>حالة طلبك الآن: <b style="color:#0071e3">${label}</b></p>
    ${status === "shipped" ? `<p>تم شحن طلبك.</p>` : ""}
    ${status === "delivered" ? `<p>نتمنى أن ينال طلبك إعجابك! لا تنسَ تقييم المنتجات في المتجر.</p>` : ""}
    ${status === "cancelled" ? `<p>إن كان هذا الإلغاء خطأً تواصل معنا وسنساعدك.</p>` : ""}
    ${itemsTable(o)}`));
}

/** Back-in-stock alert to a shopper who left their email on an out-of-stock product. */
export async function sendStockAlert(to: string, productName: string, productUrl: string): Promise<boolean> {
  if (!to.includes("@")) return false;
  return resendSend(to, `✅ توفر مجدداً: ${esc(productName)}`,
    shell("خبر سار 🎉", `
    <p>المنتج <b>${esc(productName)}</b> الذي سجلت اهتمامك به أصبح متوفراً الآن في المتجر.</p>
    <p style="text-align:center;margin:20px 0"><a href="${esc(productUrl)}" style="background:#0071e3;color:#fff;padding:12px 28px;border-radius:99px;text-decoration:none;font-weight:bold">اطلبه الآن</a></p>
    <p style="color:#999;font-size:12px">الكمية محدودة — سارع بالطلب قبل نفادها.</p>`));
}
