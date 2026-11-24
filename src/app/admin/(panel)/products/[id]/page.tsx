import React from "react";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";
import type { Brand, Category, Product, ProductVariant } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditProduct(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const db = getDb();
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(params.id) as Product | undefined;
  if (!product) notFound();
  const categories = db.prepare("SELECT * FROM categories ORDER BY sort_order").all() as Category[];
  const brands = db.prepare("SELECT * FROM brands ORDER BY sort_order").all() as Brand[];
  const variants = db.prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order, id").all(product.id) as ProductVariant[];
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">تعديل: {product.name}</h1>
      <ProductForm product={product} categories={categories} brands={brands} variants={variants} />
    </div>
  );
}
