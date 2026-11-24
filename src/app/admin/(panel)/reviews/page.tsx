import React from "react";
import { getDb } from "@/lib/db";
import ReviewsManager from "@/components/admin/ReviewsManager";
import type { Review } from "@/lib/types";

export const dynamic = "force-dynamic";

type ProductSummary = { id: number; name: string; slug: string; avg: number; cnt: number };

export default function AdminReviews() {
  const db = getDb();
  const reviews = db.prepare(
    `SELECT r.*, p.name AS product_name, p.slug AS product_slug FROM reviews r JOIN products p ON p.id = r.product_id ORDER BY r.id DESC LIMIT 200`
  ).all() as Review[];

  const perProduct = db.prepare(
    `SELECT p.id, p.name, p.slug, ROUND(AVG(r.rating), 1) AS avg, COUNT(*) AS cnt
     FROM reviews r JOIN products p ON p.id = r.product_id WHERE r.approved = 1
     GROUP BY p.id ORDER BY avg DESC, cnt DESC`
  ).all() as ProductSummary[];

  const stats = {
    count: reviews.length,
    hidden: reviews.filter((r) => !r.approved).length,
    avg: reviews.length ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10 : 0,
    dist: [5, 4, 3, 2, 1].map((n) => ({ stars: n, count: reviews.filter((r) => r.rating === n).length })),
  };

  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">التقييمات</h1>
      <p className="mt-1 text-sm text-neutral-500">كلها موثقة برقم طلب مستلَم — أخفِ أو احذف أي تقييم مسيء، ورُدّ على زبائنك</p>
      <ReviewsManager reviews={reviews} stats={stats} topProducts={perProduct.slice(0, 3)} bottomProducts={[...perProduct].sort((a, b) => a.avg - b.avg || b.cnt - a.cnt).slice(0, 3)} />
    </div>
  );
}
