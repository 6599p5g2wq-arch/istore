import React from "react";
import { getSettings } from "@/lib/settings";
import WishlistView from "@/components/store/WishlistView";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "المفضلة" };

export default function WishlistPage() {
  const s = getSettings();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <h1 className="text-3xl font-black text-white sm:text-4xl">قائمة المفضلة</h1>
      <WishlistView currency={s.currency} />
    </div>
  );
}
