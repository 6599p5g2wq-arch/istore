import { NextResponse } from "next/server";
import { bad } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { getSessionCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

// يعيد بنود طلب سابق بأسعار ومخزون اليوم لإضافتها للسلة
export async function GET(_req: Request, props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const c = (await getSessionCustomer());
  if (!c) return bad("سجل دخولك أولاً", 401);
  const db = getDb();
  const order = db.prepare("SELECT id FROM orders WHERE code = ? AND customer_id = ?").get(params.code, c.id) as { id: number } | undefined;
  if (!order) return bad("الطلب غير موجود", 404);
  const lines = db.prepare("SELECT product_id, variant_id, qty FROM order_items WHERE order_id = ?").all(order.id) as { product_id: number | null; variant_id: number | null; qty: number }[];
  const items: unknown[] = [];
  let skipped = 0;
  for (const l of lines) {
    const p = db.prepare("SELECT id, name, slug, price, image, stock FROM products WHERE id = ? AND active = 1").get(l.product_id) as { id: number; name: string; slug: string; price: number; image: string; stock: number } | undefined;
    if (!p) { skipped++; continue; }
    let price = p.price, stock = p.stock, label = "";
    if (l.variant_id) {
      const v = db.prepare("SELECT id, label, price, stock FROM product_variants WHERE id = ? AND product_id = ?").get(l.variant_id, p.id) as { id: number; label: string; price: number | null; stock: number } | undefined;
      if (!v) { skipped++; continue; }
      price = v.price ?? p.price; stock = v.stock; label = v.label;
    }
    if (stock < 1) { skipped++; continue; }
    items.push({ id: p.id, name: p.name, price, image: p.image, slug: p.slug, stock, variant_id: l.variant_id, variant_label: label, qty: Math.min(l.qty, stock) });
  }
  return NextResponse.json({ items, skipped });
}
