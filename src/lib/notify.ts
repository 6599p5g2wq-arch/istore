/**
 * New-order email notification via the Resend API (free tier).
 * No-op when RESEND_API_KEY or NOTIFY_EMAIL is not configured, so checkout
 * never depends on the email service.
 */
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

export async function notifyNewOrder(o: OrderNotice): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return;

  const money = (n: number) => `${n.toLocaleString("en-US")} ${o.currency}`;
  const rows = o.items
    .map(
      (it) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${it.name}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${it.qty}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:left">${money(it.price * it.qty)}</td></tr>`
    )
    .join("");

  const html = `
  <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:560px;margin:auto;background:#f7f7f9;padding:24px;border-radius:16px">
    <h2 style="margin:0 0 4px">🛒 طلب جديد: <span dir="ltr">${o.code}</span></h2>
    <p style="margin:0 0 16px;color:#666">وصلك طلب جديد من المتجر — راجعه من لوحة التحكم.</p>
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden">
      <tr><td style="padding:8px 12px;color:#888">الزبون</td><td style="padding:8px 12px;font-weight:bold">${o.customer}</td></tr>
      <tr><td style="padding:8px 12px;color:#888">الهاتف</td><td style="padding:8px 12px;font-weight:bold" dir="ltr">${o.phone}</td></tr>
      <tr><td style="padding:8px 12px;color:#888">المدينة</td><td style="padding:8px 12px">${o.city}</td></tr>
      ${o.address ? `<tr><td style="padding:8px 12px;color:#888">العنوان</td><td style="padding:8px 12px">${o.address}</td></tr>` : ""}
      ${o.notes ? `<tr><td style="padding:8px 12px;color:#888">ملاحظات</td><td style="padding:8px 12px">${o.notes}</td></tr>` : ""}
    </table>
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;margin-top:12px">
      <tr style="background:#111;color:#fff"><td style="padding:8px 12px">المنتج</td><td style="padding:8px 12px;text-align:center">الكمية</td><td style="padding:8px 12px;text-align:left">السعر</td></tr>
      ${rows}
      <tr><td style="padding:8px 12px;color:#888">المجموع الفرعي</td><td></td><td style="padding:8px 12px;text-align:left">${money(o.subtotal)}</td></tr>
      ${o.discount > 0 ? `<tr><td style="padding:8px 12px;color:#16a34a">الخصم${o.couponCode ? ` (${o.couponCode})` : ""}</td><td></td><td style="padding:8px 12px;text-align:left;color:#16a34a">- ${money(o.discount)}</td></tr>` : ""}
      <tr><td style="padding:8px 12px;color:#888">التوصيل</td><td></td><td style="padding:8px 12px;text-align:left">${o.deliveryFee === 0 ? "مجاني" : money(o.deliveryFee)}</td></tr>
      <tr><td style="padding:10px 12px;font-weight:bold;font-size:16px">الإجمالي</td><td></td><td style="padding:10px 12px;font-weight:bold;font-size:16px;text-align:left;color:#0071e3">${money(o.total)}</td></tr>
    </table>
    <p style="color:#999;font-size:12px;margin-top:16px">الدفع عند الاستلام — تواصل مع الزبون لتأكيد الطلب قبل الشحن.</p>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "آي ستور <onboarding@resend.dev>",
      to: [to],
      subject: `🛒 طلب جديد ${o.code} — ${money(o.total)} — ${o.customer}`,
      html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[notify] Resend failed (${res.status}): ${detail.slice(0, 300)}`);
  }
}

/** Back-in-stock alert to a shopper who left their email on an out-of-stock product. */
export async function sendStockAlert(to: string, productName: string, productUrl: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to.includes("@")) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "آي ستور <onboarding@resend.dev>",
      to: [to],
      subject: `✅ توفر مجدداً: ${productName}`,
      html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:520px;margin:auto;background:#f7f7f9;padding:24px;border-radius:16px">
        <h2 style="margin:0 0 8px">خبر سار 🎉</h2>
        <p>المنتج <b>${productName}</b> الذي سجلت اهتمامك به أصبح متوفراً الآن في المتجر.</p>
        <p style="text-align:center;margin:20px 0"><a href="${productUrl}" style="background:#0071e3;color:#fff;padding:12px 28px;border-radius:99px;text-decoration:none;font-weight:bold">اطلبه الآن</a></p>
        <p style="color:#999;font-size:12px">الكمية محدودة — سارع بالطلب قبل نفادها.</p>
      </div>`,
    }),
  });
  if (!res.ok) console.error(`[notify] stock alert failed (${res.status})`);
}
