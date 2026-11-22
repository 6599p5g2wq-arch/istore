import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, bad } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled"];

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const b = await req.json().catch(() => ({}));
  if (!STATUSES.includes(b.status)) return bad("حالة غير صالحة");
  const db = getDb();
  const order = db.prepare("SELECT status FROM orders WHERE id = ?").get(params.id) as { status: string } | undefined;
  if (!order) return bad("الطلب غير موجود", 404);
  // restore stock when cancelling
  if (b.status === "cancelled" && order.status !== "cancelled") {
    const items = db.prepare("SELECT product_id, qty FROM order_items WHERE order_id = ?").all(params.id) as { product_id: number | null; qty: number }[];
    const restore = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
    for (const it of items) if (it.product_id) restore.run(it.qty, it.product_id);
  }
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(b.status, params.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(); if (auth) return auth;
  const db = getDb();
  db.prepare("DELETE FROM orders WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
