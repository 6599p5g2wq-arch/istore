import React from "react";
import { getDb } from "@/lib/db";
import BrandsManager from "@/components/admin/BrandsManager";
import type { Brand } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function AdminBrands() {
  const db = getDb();
  const brands = db.prepare(`SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id) AS products_count FROM brands b ORDER BY b.sort_order`).all() as (Brand & { products_count: number })[];
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">الماركات</h1>
      <BrandsManager brands={brands} />
    </div>
  );
}
