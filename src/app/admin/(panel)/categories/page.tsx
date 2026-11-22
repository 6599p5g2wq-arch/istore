import React from "react";
import { getDb } from "@/lib/db";
import CategoriesManager from "@/components/admin/CategoriesManager";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function AdminCategories() {
  const db = getDb();
  const cats = db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS products_count FROM categories c ORDER BY c.sort_order`).all() as (Category & { products_count: number })[];
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">التصنيفات</h1>
      <CategoriesManager categories={cats} />
    </div>
  );
}
