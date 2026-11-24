import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

// تصدير CSV بترميز UTF-8 مع BOM ليفتح بالعربية صحيحاً في Excel
export async function GET(req: NextRequest) {
  const auth = (await requireAdmin()); if (auth) return auth;
  const db = getDb();
  const guests = req.nextUrl.searchParams.get("tab") === "guests";
  let rows: unknown[][];
  let head: string[];
  if (guests) {
    head = ["الاسم", "الهاتف", "عدد الطلبات", "إجمالي المشتريات", "آخر طلب"];
    rows = (db.prepare("SELECT MAX(customer_name) n, phone, COUNT(*) c, SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END) t, MAX(created_at) l FROM orders WHERE customer_id IS NULL GROUP BY phone ORDER BY l DESC").all() as { n: string; phone: string; c: number; t: number; l: string }[]).map((r) => [r.n, r.phone, r.c, r.t, r.l]);
  } else {
    head = ["الاسم", "الهاتف", "البريد", "تاريخ التسجيل", "آخر دخول", "الحالة", "عدد الطلبات", "إجمالي المشتريات", "آخر طلب"];
    rows = (db.prepare(`SELECT c.name, c.phone, c.email, c.created_at, c.last_login, c.blocked, COUNT(o.id) oc, COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total END), 0) t, MAX(o.created_at) l
      FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY c.id DESC`).all() as { name: string; phone: string; email: string; created_at: string; last_login: string | null; blocked: number; oc: number; t: number; l: string | null }[])
      .map((r) => [r.name, r.phone, r.email, r.created_at, r.last_login || "", r.blocked ? "موقوف" : "نشط", r.oc, r.t, r.l || ""]);
  }
  const csv = "\ufeff" + [head, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${guests ? "guests" : "customers"}.csv"` } });
}
