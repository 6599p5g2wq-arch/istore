"use client";
import React from "react";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-bold text-neutral-700 shadow-sm transition hover:bg-neutral-100">
      <Printer size={16} /> طباعة الطلب
    </button>
  );
}
