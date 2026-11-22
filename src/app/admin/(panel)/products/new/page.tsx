import React from "react";
import { getDb } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function NewProduct() {
  const categories = getDb().prepare("SELECT * FROM categories ORDER BY sort_order").all() as Category[];
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">منتج جديد</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
