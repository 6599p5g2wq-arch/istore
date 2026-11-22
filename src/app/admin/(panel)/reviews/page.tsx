import React from "react";
import { getDb } from "@/lib/db";
import ReviewsManager from "@/components/admin/ReviewsManager";
import type { Review } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function AdminReviews() {
  const db = getDb();
  const reviews = db.prepare(
    `SELECT r.*, p.name AS product_name FROM reviews r JOIN products p ON p.id = r.product_id ORDER BY r.id DESC LIMIT 100`
  ).all() as Review[];
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">التقييمات</h1>
      <p className="mt-1 text-sm text-neutral-500">كلها موثقة برقم طلب مستلَم — احذف أي تقييم مسيء</p>
      <ReviewsManager reviews={reviews} />
    </div>
  );
}
