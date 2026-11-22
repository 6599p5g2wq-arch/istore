import React from "react";
import { getDb } from "@/lib/db";
import HeroManager from "@/components/admin/HeroManager";
import type { HeroSlide } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function AdminHero() {
  const slides = getDb().prepare("SELECT * FROM hero_slides ORDER BY sort_order").all() as HeroSlide[];
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">شرائح الصفحة الرئيسية</h1>
      <p className="mt-1 text-sm text-neutral-500">السلايدر الكبير أعلى الصفحة الرئيسية — عدّل العناوين والصور والأزرار</p>
      <HeroManager slides={slides} />
    </div>
  );
}
