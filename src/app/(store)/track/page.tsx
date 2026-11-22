import React from "react";
import TrackForm from "@/components/store/TrackForm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تتبع طلبك" };

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6">
      <h1 className="text-center text-3xl font-black sm:text-4xl">تتبع طلبك</h1>
      <p className="mt-3 text-center text-neutral-500">أدخل رقم الطلب ورقم هاتفك لمعرفة حالة طلبك</p>
      <TrackForm />
    </div>
  );
}
