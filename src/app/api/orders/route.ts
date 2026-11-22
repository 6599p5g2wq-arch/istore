import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { notifyNewOrder } from "@/lib/notify";
import { sendTelegram } from "@/lib/telegram";
import { getSetting } from "@/lib/settings";
import { validateCoupon } from "@/lib/coupons";
import { getSessionCustomer } from "@/lib/customer-auth";
import { parseOptions } from "@/lib/variants";
import type { ProductVariant } from "@/lib/types";

export const dynamic = "force-dynamic";

type Item = { id: number; qty: number; variant_id?: number | null };

export async function POST(req: NextRequest) {
  let body: { name?: string; phone?: string; city?: string; address?: string; notes?: string; coupon?: string; items?: Item[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();
  const city = (body.city || "").trim();
  const address = (body.address || "").trim();
  const notes = (body.notes || "").trim();
  const items = Array.isArray(body.items) ? body.items.filter((i) => i && i.id > 0 && i.qty > 0) : [];
  const couponCode = (body.coupon || "").trim();

  if (!name || !phone || !city) return NextResponse.json({ error: "يرجى تعبئة الاسم ورقم الهاتف والمدينة" }, { status: 400 });
  if (items.length === 0) return NextResponse.json({ error: "السلة فارغة" }, { status: 400 });
  if (name.length > 120 || phone.length > 30 || address.length > 300 || notes.length > 500) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const db = getDb();
  const cityRow = db.prepare("SELECT fee FROM cities WHERE name = ? AND active = 1").get(city) as { fee: number } | undefined;
  if (!cityRow) return NextResponse.json({ error: "المدينة غير مدعومة حالياً" }, { status: 400 });

  const freeThreshold = Number((db.prepare("SELECT value FROM settings WHERE key = 'free_shipping_threshold'").get() as { value: string } | undefined)?.value || 0);

  const getProduct = db.prepare("SELECT id, name, price, stock, active, options FROM products WHERE id = ?");
  const getVariants = db.prepare("SELECT * FROM product_variants WHERE product_id = ?");

  const tx = db.transaction(() => {
    let subtotal = 0;
    const lines: { id: number; variantId: number | null; name: string; label: string; price: number; qty: number }[] = [];
    for (const it of items) {
      const p = getProduct.get(it.id) as { id: number; name: string; price: number; stock: number; active: number; options: string } | undefined;
      if (!p || !p.active) throw new Error(`منتج غير متوفر: #${it.id}`);
      const qty = Math.min(Math.floor(it.qty), 99);
      let price = p.price;
      let stockAvail = p.stock;
      let variantId: number | null = null;
      let label = "";
      if (parseOptions(p.options).length > 0) {
        const variants = getVariants.all(p.id) as ProductVariant[];
        const v = variants.find((x) => x.id === Number(it.variant_id));
        if (!v) throw new Error(`يرجى اختيار الخيار المطلوب لـ «${p.name}»`);
        variantId = v.id;
        label = v.label;
        price = v.price ?? p.price;
        stockAvail = v.stock;
      }
      if (stockAvail < qty) throw new Error(`الكمية المطلوبة من «${p.name}${label ? " — " + label : ""}» غير متوفرة (المتوفر: ${stockAvail})`);
      subtotal += price * qty;
      lines.push({ id: p.id, variantId, name: p.name, label, price, qty });
    }
    let discount = 0;
    if (couponCode) {
      const v = validateCoupon(db, couponCode, subtotal);
      if (!v.ok) throw new Error(v.error);
      discount = v.discount;
    }
    const deliveryFee = freeThreshold > 0 && subtotal - discount >= freeThreshold ? 0 : cityRow.fee;
    const code = "IST-" + crypto.randomBytes(3).toString("hex").toUpperCase();
    const customer = getSessionCustomer();
    const r = db.prepare(
      "INSERT INTO orders (code, customer_name, phone, city, address, notes, subtotal, discount, coupon_code, delivery_fee, total, customer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(code, name, phone, city, address, notes, subtotal, discount, discount > 0 ? couponCode.toUpperCase() : "", deliveryFee, subtotal - discount + deliveryFee, customer?.id ?? null);
    const orderId = Number(r.lastInsertRowid);
    const insertItem = db.prepare("INSERT INTO order_items (order_id, product_id, variant_id, name, variant_label, price, qty) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const decStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
    const decVariant = db.prepare("UPDATE product_variants SET stock = stock - ? WHERE id = ?");
    for (const l of lines) {
      insertItem.run(orderId, l.id, l.variantId, l.name, l.label, l.price, l.qty);
      decStock.run(l.qty, l.id);
      if (l.variantId) decVariant.run(l.qty, l.variantId);
    }
    const discountAmt = couponCode ? (validateCoupon(db, couponCode, subtotal) as { ok: true; discount: number }).discount : 0;
    const deliveryFeeFinal = freeThreshold > 0 && subtotal - discountAmt >= freeThreshold ? 0 : cityRow.fee;
    return { code, orderId, lines, subtotal, discount: discountAmt, deliveryFee: deliveryFeeFinal };
  });

  try {
    const { code, orderId, lines, subtotal, discount, deliveryFee } = tx();
    const currency = (db.prepare("SELECT value FROM settings WHERE key = 'currency'").get() as { value: string } | undefined)?.value || "د.ل";
    // Checkout completed: clear any abandoned-cart lead for this phone.
    db.prepare("DELETE FROM cart_leads WHERE phone = ?").run(phone);
    const notifyLines = lines.map((l) => ({ name: l.label ? `${l.name} — ${l.label}` : l.name, price: l.price, qty: l.qty }));
    // Fire-and-forget: never let the notification delay or break checkout.
    notifyNewOrder({ code, customer: name, phone, city, address, notes, items: notifyLines, subtotal, discount, couponCode, deliveryFee, total: subtotal - discount + deliveryFee, currency }).catch(() => {});
    // تنبيه تيليجرام للمالك — لا يؤثر على إتمام الطلب إطلاقاً
    const money = (n: number) => `${n.toLocaleString("en-US")} ${currency}`;
    const siteUrl = getSetting("site_url");
    const orderUrl = siteUrl ? `${siteUrl.replace(/\/$/, "")}/admin/orders/${orderId}` : "";
    const tgText = [
      `🛒 طلب جديد: ${code}`,
      `الزبون: ${name}`,
      `الهاتف: ${phone}`,
      `المدينة: ${city}`,
      ...notifyLines.map((l) => `• ${l.name} × ${l.qty} — ${money(l.price * l.qty)}`),
      `الإجمالي: ${money(subtotal - discount + deliveryFee)}`,
      orderUrl,
    ].join("\n");
    sendTelegram(tgText).catch(() => {});
    return NextResponse.json({ ok: true, code });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "حدث خطأ" }, { status: 400 });
  }
}
