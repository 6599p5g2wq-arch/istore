"use client";
import React from "react";
import { Star } from "lucide-react";
import DeleteButton from "./DeleteButton";
import { formatDate } from "@/lib/format";
import type { Review } from "@/lib/types";

export default function ReviewsManager({ reviews }: { reviews: Review[] }) {
  return (
    <div className="mt-6 space-y-3">
      {reviews.length === 0 && <p className="rounded-3xl bg-white p-10 text-center text-sm text-neutral-400 shadow-sm">لا توجد تقييمات بعد</p>}
      {reviews.map((r) => (
        <div key={r.id} className="flex flex-wrap items-start gap-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex pt-1">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={16} className={n <= r.rating ? "text-amber-400" : "text-neutral-200"} fill="currentColor" />)}</div>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold">{r.customer_name} <span className="text-xs font-normal text-neutral-400">على «{r.product_name}»</span></p>
            {r.comment && <p className="mt-1 text-sm text-neutral-600">{r.comment}</p>}
            <p className="mt-1 text-xs text-neutral-400"><span dir="ltr">{r.order_code}</span> — {formatDate(r.created_at)}</p>
          </div>
          <DeleteButton resource="reviews" id={r.id} label={`تقييم ${r.customer_name}`} />
        </div>
      ))}
    </div>
  );
}
