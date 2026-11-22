import React from "react";
import CartView from "@/components/store/CartView";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "سلة التسوق" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">سلة التسوق</h1>
      <CartView />
    </div>
  );
}
