import React from "react";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { Plus, Pencil, Star, Eye } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";
import ProductsBulkBar from "@/components/admin/ProductsBulkBar";
import ProductsFilters from "@/components/admin/ProductsFilters";
import ProductToggles from "@/components/admin/ProductToggles";
import DuplicateButton from "@/components/admin/DuplicateButton";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;
const LOW_STOCK = 5;

type Row = Product & { category_name: string | null; brand_name: string | null; sold: number; revenue: number };

function chipLink(params: Record<string, string>, patch: Record<string, string>) {
  const p = new URLSearchParams({ ...params, ...patch });
  p.forEach((v, k) => { if (!v) p.delete(k); });
  if (!patch.page) p.delete("page");
  const s = p.toString();
  return `/admin/products${s ? `?${s}` : ""}`;
}

export default async function AdminProducts(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const searchParams = await props.searchParams;
  const db = getDb();
  const s = getSettings();
  const q = (searchParams.q || "").trim();
  const cat = (searchParams.cat || "").trim();
  const brand = (searchParams.brand || "").trim();
  const sort = searchParams.sort || "new";
  const stock = searchParams.stock || "all";
  const vis = searchParams.vis || "all";
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);

  const where: string[] = [];
  const args: (string | number)[] = [];
  if (q) {
    where.push("(p.name LIKE ? OR p.slug LIKE ? OR c.name LIKE ? OR b.name LIKE ?)");
    args.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (cat) { where.push("p.category_id = ?"); args.push(Number(cat)); }
  if (brand) { where.push("p.brand_id = ?"); args.push(Number(brand)); }
  if (vis === "active") where.push("p.active = 1");
  if (vis === "hidden") where.push("p.active = 0");
  if (stock === "low") { where.push("p.stock > 0 AND p.stock <= ?"); args.push(LOW_STOCK); }
  if (stock === "out") where.push("p.stock = 0");
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const orderSql =
    sort === "sold" ? "sold DESC, p.id DESC"
    : sort === "stock" ? "p.stock ASC, p.id DESC"
    : sort === "price" ? "p.price DESC, p.id DESC"
    : "p.id DESC";

  const baseSql = `FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN (
      SELECT oi.product_id, SUM(oi.qty) AS sold, SUM(oi.qty * oi.price) AS revenue
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'cancelled' AND oi.product_id IS NOT NULL
      GROUP BY oi.product_id
    ) sl ON sl.product_id = p.id
    ${whereSql}`;

  const total = (db.prepare(`SELECT COUNT(*) AS n ${baseSql}`).get(...args) as { n: number }).n;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const cur = Math.min(page, pages);
  const products = db.prepare(
    `SELECT p.*, c.name AS category_name, b.name AS brand_name, COALESCE(sl.sold, 0) AS sold, COALESCE(sl.revenue, 0) AS revenue ${baseSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`
  ).all(...args, PER_PAGE, (cur - 1) * PER_PAGE) as Row[];

  const stats = db.prepare(`SELECT COUNT(*) AS total,
    SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) AS hidden,
    SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) AS out,
    SUM(CASE WHEN stock > 0 AND stock <= ${LOW_STOCK} THEN 1 ELSE 0 END) AS low,
    COALESCE(SUM(stock * price), 0) AS stock_value
    FROM products`).get() as { total: number; hidden: number; out: number; low: number; stock_value: number };

  const categories = db.prepare("SELECT id, name FROM categories ORDER BY sort_order").all() as { id: number; name: string }[];

  const params: Record<string, string> = { q, cat, sort, stock: stock === "all" ? "" : stock, vis: vis === "all" ? "" : vis, page: cur > 1 ? String(cur) : "" };
  const chips = [
    { k: "vis", v: "", label: `الكل (${stats.total})` },
    { k: "vis", v: "active", label: `ظاهر (${stats.total - (stats.hidden || 0)})` },
    { k: "vis", v: "hidden", label: `مخفي (${stats.hidden || 0})` },
    { k: "stock", v: "low", label: `مخزون منخفض (${stats.low || 0})` },
    { k: "stock", v: "out", label: `نفذ (${stats.out || 0})` },
  ];
  const isOn = (c: { k: string; v: string }) =>
    c.k === "vis" ? (vis === c.v || (c.v === "" && vis === "all" && stock === "all")) : stock === c.v;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">المنتجات</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {stats.total} منتج{stats.hidden ? ` · ${stats.hidden} مخفي` : ""}{stats.out ? ` · ${stats.out} نفذ مخزونه` : ""}
          </p>
        </div>
        <Link href="/admin/products/new" className="flex items-center gap-2 rounded-full bg-black px-6 py-3 font-bold text-white transition hover:bg-neutral-800">
          <Plus size={18} /> منتج جديد
        </Link>
      </div>

      <ProductsFilters q={q} cat={cat} sort={sort} categories={categories} />

      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((c) => (
          <Link key={`${c.k}-${c.v}`} href={chipLink(params, c.k === "vis" ? { vis: c.v } : { stock: c.v })}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${isOn(c) ? "bg-black text-white" : "bg-white text-neutral-600 shadow-sm hover:bg-neutral-100"}`}>
            {c.label}
          </Link>
        ))}
      </div>

      <p className="mt-4 text-xs text-neutral-500">
        عرض {products.length} من {total} منتجاً{q || cat ? " (مفلترة)" : ""} · إجمالي قيمة المخزون {formatPrice(stats.stock_value, s.currency)}
      </p>

      {/* بطاقات الجوال */}
      <div className="mt-4 space-y-3 lg:hidden">
        {products.map((p) => (
          <div key={p.id} className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <input type="checkbox" className="js-bulk mt-2 h-4 w-4 accent-black" value={p.id} aria-label={`تحديد ${p.name}`} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" className="h-16 w-16 shrink-0 rounded-2xl bg-neutral-100 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-bold">{p.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                  <Star size={11} className="text-amber-400" fill="currentColor" /> {p.rating.toFixed(1)}
                  {p.badge && <span className="mr-1 rounded bg-neutral-100 px-1.5 py-0.5">{p.badge}</span>}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-extrabold">{formatPrice(p.price, s.currency)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${p.stock === 0 ? "bg-red-100 text-red-600" : p.stock <= LOW_STOCK ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{p.stock}</span>
                  <span className="text-xs text-neutral-400">بيع {p.sold}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
              <ProductToggles id={p.id} active={!!p.active} featured={!!p.featured} />
              <div className="flex gap-2">
                <Link href={`/admin/products/${p.id}`} className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white" aria-label="تعديل"><Pencil size={15} /></Link>
                <DuplicateButton id={p.id} />
                <DeleteButton resource="products" id={p.id} label={p.name} />
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-neutral-400">لا توجد منتجات مطابقة</p>}
      </div>

      {/* جدول سطح المكتب */}
      <div className="mt-4 hidden overflow-x-auto rounded-3xl bg-white p-4 shadow-sm lg:block">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b text-right text-xs text-neutral-400">
              <th className="w-10 p-3"><input type="checkbox" className="js-bulk-all h-4 w-4 accent-black" aria-label="تحديد الكل" /></th>
              <th className="p-3 font-bold">المنتج</th><th className="p-3 font-bold">التصنيف</th><th className="p-3 font-bold">السعر</th>
              <th className="p-3 font-bold">المخزون</th><th className="p-3 font-bold">المبيعات</th><th className="p-3 font-bold">مميز</th>
              <th className="p-3 font-bold">ظاهر</th><th className="p-3 font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60">
                <td className="p-3"><input type="checkbox" className="js-bulk h-4 w-4 accent-black" value={p.id} aria-label={`تحديد ${p.name}`} /></td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" className="h-12 w-12 rounded-xl bg-neutral-100 object-cover" />
                    <div>
                      <p className="line-clamp-1 font-bold">{p.name}</p>
                      <p className="flex items-center gap-1 text-xs text-neutral-400"><Star size={11} className="text-amber-400" fill="currentColor" /> {p.rating.toFixed(1)} {p.badge && <span className="mr-1 rounded bg-neutral-100 px-1.5 py-0.5">{p.badge}</span>}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-neutral-500">{p.category_name || "—"}</td>
                <td className="p-3">
                  <span className="font-bold">{formatPrice(p.price, s.currency)}</span>
                  {p.old_price && <span className="block text-xs text-neutral-400 line-through">{formatPrice(p.old_price, s.currency)}</span>}
                </td>
                <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${p.stock === 0 ? "bg-red-100 text-red-600" : p.stock <= LOW_STOCK ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{p.stock}</span></td>
                <td className="p-3">
                  <span className="font-extrabold">{p.sold}</span>
                  {p.revenue > 0 && <span className="block text-xs text-neutral-400">{formatPrice(p.revenue, s.currency)}</span>}
                </td>
                <td className="p-3"><ProductToggles id={p.id} active={!!p.active} featured={!!p.featured} only="featured" /></td>
                <td className="p-3"><ProductToggles id={p.id} active={!!p.active} featured={!!p.featured} only="active" /></td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/products/${p.id}`} className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white" aria-label="تعديل"><Pencil size={15} /></Link>
                    <DuplicateButton id={p.id} />
                    <Link href={`/product/${p.slug}`} target="_blank" className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white" aria-label="معاينة في المتجر"><Eye size={15} /></Link>
                    <DeleteButton resource="products" id={p.id} label={p.name} />
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-sm font-bold text-neutral-400">لا توجد منتجات مطابقة</td></tr>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm font-bold">
          {cur > 1 && <Link href={chipLink(params, { page: String(cur - 1) })} className="rounded-full bg-white px-4 py-2 shadow-sm transition hover:bg-neutral-100">السابق</Link>}
          <span className="text-neutral-500">صفحة {cur} من {pages}</span>
          {cur < pages && <Link href={chipLink(params, { page: String(cur + 1) })} className="rounded-full bg-white px-4 py-2 shadow-sm transition hover:bg-neutral-100">التالي</Link>}
        </div>
      )}

      <ProductsBulkBar />
    </div>
  );
}
