import React from "react";
import { getDb } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";
import type { Brand, Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function NewProduct() {
  const categories = getDb().prepare("SELECT * FROM categories ORDER BY sort_order").all() as Category[];
  const brands = getDb().prepare("SELECT * FROM brands ORDER BY sort_order").all() as Brand[];
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">منتج جديد</h1>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
