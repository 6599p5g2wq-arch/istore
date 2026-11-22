import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { notifyNewOrder } from "@/lib/notify";
import { validateCoupon } from "@/lib/coupons";
import { getSessionCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

type Item = { id: number; qty: number };

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

  const getProduct = db.prepare("SELECT id, name, price, stock, active FROM products WHERE id = ?");

  const tx = db.transaction(() => {
    let subtotal = 0;
    const lines: { id: number; name: string; price: number; qty: number }[] = [];
    for (const it of items) {
      const p = getProduct.get(it.id) as { id: number; name: string; price: number; stock: number; active: number } | undefined;
      if (!p || !p.active) throw new Error(`منتج غير متوفر: #${it.id}`);
      const qty = Math.min(Math.floor(it.qty), 99);
      if (p.stock < qty) throw new Error(`الكمية المطلوبة من «${p.name}» غير متوفرة (المتوفر: ${p.stock})`);
      subtotal += p.price * qty;
      lines.push({ id: p.id, name: p.name, price: p.price, qty });
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
    const insertItem = db.prepare("INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES (?, ?, ?, ?, ?)");
    const decStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
    for (const l of lines) {
      insertItem.run(orderId, l.id, l.name, l.price, l.qty);
      decStock.run(l.qty, l.id);
    }
    const discountAmt = couponCode ? (validateCoupon(db, couponCode, subtotal) as { ok: true; discount: number }).discount : 0;
    const deliveryFeeFinal = freeThreshold > 0 && subtotal - discountAmt >= freeThreshold ? 0 : cityRow.fee;
    return { code, lines, subtotal, discount: discountAmt, deliveryFee: deliveryFeeFinal };
  });

  try {
    const { code, lines, subtotal, discount, deliveryFee } = tx();
    const currency = (db.prepare("SELECT value FROM settings WHERE key = 'currency'").get() as { value: string } | undefined)?.value || "د.ل";
    // Checkout completed: clear any abandoned-cart lead for this phone.
    db.prepare("DELETE FROM cart_leads WHERE phone = ?").run(phone);
    // Fire-and-forget: never let the notification delay or break checkout.
    notifyNewOrder({ code, customer: name, phone, city, address, notes, items: lines, subtotal, discount, couponCode, deliveryFee, total: subtotal - discount + deliveryFee, currency }).catch(() => {});
    return NextResponse.json({ ok: true, code });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "حدث خطأ" }, { status: 400 });
  }
}
