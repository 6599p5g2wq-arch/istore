import React from "react";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";
import type { Category, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function EditProduct({ params }: { params: { id: string } }) {
  const db = getDb();
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(params.id) as Product | undefined;
  if (!product) notFound();
  const categories = db.prepare("SELECT * FROM categories ORDER BY sort_order").all() as Category[];
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">تعديل: {product.name}</h1>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
