import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Order, OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

function normalizePhone(p: string) {
  return p.replace(/[^\d+]/g, "").replace(/^\+?218/, "0");
}

export function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") || "").trim().toUpperCase();
  const phone = (req.nextUrl.searchParams.get("phone") || "").trim();
  if (!code || !phone) return NextResponse.json({ error: "أدخل رقم الطلب ورقم الهاتف" }, { status: 400 });
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE UPPER(code) = ?").get(code) as Order | undefined;
  if (!order || normalizePhone(order.phone) !== normalizePhone(phone)) {
    return NextResponse.json({ error: "لم يتم العثور على طلب بهذه البيانات" }, { status: 404 });
  }
  const items = db.prepare("SELECT name, variant_label, qty FROM order_items WHERE order_id = ?").all(order.id) as Pick<OrderItem, "name" | "variant_label" | "qty">[];
  return NextResponse.json({ order: { code: order.code, status: order.status, total: order.total, city: order.city, created_at: order.created_at, items } });
}
