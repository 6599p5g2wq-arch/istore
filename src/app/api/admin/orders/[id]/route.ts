import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";
import { applyOrderStatusEffects } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled"];

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
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
    // restore stock when cancelling
    if (b.status === "cancelled" && order.status !== "cancelled") {
      const items = db.prepare("SELECT product_id, qty FROM order_items WHERE order_id = ?").all(params.id) as { product_id: number | null; qty: number }[];
      const restore = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
      for (const it of items) if (it.product_id) restore.run(it.qty, it.product_id);
    }
    if (b.status !== order.status) {
      db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(b.status, params.id);
      db.prepare("INSERT INTO order_status_log (order_id, status) VALUES (?, ?)").run(params.id, b.status);
      applyOrderStatusEffects(db, Number(params.id), order.status, b.status);
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const db = getDb();
  db.prepare("DELETE FROM orders WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
