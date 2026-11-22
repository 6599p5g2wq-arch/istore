import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import type { Product, Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (getSetting("site_url", "") || "http://localhost:3000").replace(/\/$/, "");
  const db = getDb();
  const products = db.prepare("SELECT slug, created_at FROM products WHERE active = 1").all() as Pick<Product, "slug" | "created_at">[];
  const cats = db.prepare("SELECT slug FROM categories WHERE active = 1").all() as Pick<Category, "slug">[];
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/track`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.4 },
    ...cats.map((c) => ({ url: `${base}/products?category=${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.created_at, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
