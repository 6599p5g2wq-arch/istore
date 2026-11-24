import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";
import { applyOrderStatusEffects } from "@/lib/loyalty";
import { sendOrderStatusEmail, type OrderNotice } from "@/lib/notify";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled"];

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = (await requireAdmin());if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  const db = getDb();
  const order = db.prepare("SELECT status FROM orders WHERE id = ?").get(params.id) as { status: string } | undefined;
  if (!order) return bad("الطلب غير موجود", 404);

  // ملاحظات الأدمن الداخلية (لا تظهر للعميل)
  if (typeof b.notes === "string") {
    db.prepare("UPDATE orders SET admin_notes = ? WHERE id = ?").run(b.notes.slice(0, 2000), params.id);
  }

  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status)) return bad("حالة غير صالحة");
    if (b.status !== order.status) {
      try { db.transaction(() => {
        const fresh = db.prepare("SELECT status FROM orders WHERE id=?").get(params.id) as {status:string};
        if (fresh.status === b.status) return;
        const items = db.prepare("SELECT product_id, variant_id, qty FROM order_items WHERE order_id=?").all(params.id) as {product_id:number|null;variant_id:number|null;qty:number}[];
        const delta = b.status === "cancelled" ? 1 : fresh.status === "cancelled" ? -1 : 0;
        if (delta) for (const it of items) {
          if (delta < 0 && it.product_id) {
            const p=db.prepare("SELECT stock,active FROM products WHERE id=?").get(it.product_id) as {stock:number;active:number}|undefined;
            const v=it.variant_id ? db.prepare("SELECT stock FROM product_variants WHERE id=? AND product_id=?").get(it.variant_id,it.product_id) as {stock:number}|undefined : null;
            if (!p || !p.active || p.stock<it.qty || (it.variant_id && (!v || v.stock<it.qty))) throw new Error("لا يمكن إعادة تفعيل الطلب: المخزون غير كافٍ");
          }
          if(it.product_id) db.prepare("UPDATE products SET stock=stock+? WHERE id=?").run(delta*it.qty,it.product_id);
          if(it.variant_id) db.prepare("UPDATE product_variants SET stock=stock+? WHERE id=?").run(delta*it.qty,it.variant_id);
        }
        if (b.status !== fresh.status) {
          db.prepare("UPDATE orders SET status=? WHERE id=?").run(b.status,params.id);
          db.prepare("INSERT INTO order_status_log(order_id,status) VALUES (?,?)").run(params.id,b.status);
          applyOrderStatusEffects(db,Number(params.id),fresh.status,b.status);
        }
      })(); } catch(e) { return bad(e instanceof Error ? e.message : "تعذر تحديث الطلب"); }
      // إشعار الزبون بتغيّر الحالة إن كان عندنا بريده — لا يعطّل الحفظ إطلاقاً
      const full = db.prepare("SELECT * FROM orders WHERE id = ?").get(params.id) as Record<string, unknown> | undefined;
      if (full) {
        const email = String(full.email || "") || (full.customer_id ? String((db.prepare("SELECT email FROM customers WHERE id = ?").get(full.customer_id) as { email: string } | undefined)?.email || "") : "");
        if (email) {
          const items = db.prepare("SELECT name, variant_label, price, qty FROM order_items WHERE order_id = ?").all(params.id) as { name: string; variant_label: string; price: number; qty: number }[];
          const notice: OrderNotice = {
            code: String(full.code), customer: String(full.customer_name), phone: String(full.phone), city: String(full.city),
            address: String(full.address || ""), notes: "",
            items: items.map((i) => ({ name: i.variant_label ? `${i.name} — ${i.variant_label}` : i.name, price: i.price, qty: i.qty })),
            subtotal: Number(full.subtotal) || 0, discount: Number(full.discount) || 0, couponCode: String(full.coupon_code || ""),
            deliveryFee: Number(full.delivery_fee) || 0, total: Number(full.total) || 0, currency: getSetting("currency", "د.ل"),
          };
          sendOrderStatusEmail(email, notice, b.status).catch(() => {});
        }
      }
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = (await requireAdmin());if (auth) return auth;
  const db = getDb();
  db.prepare("DELETE FROM orders WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
