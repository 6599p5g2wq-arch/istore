import React from "react";
import { getSettings } from "@/lib/settings";
import Reveal from "@/components/store/Reveal";
import { RefreshCcw, Truck, Store } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "من نحن" };

export default function AboutPage() {
  const s = getSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 sm:px-6">
      <Reveal>
        <h1 className="text-3xl font-black sm:text-4xl">من نحن</h1>
        <p className="mt-6 whitespace-pre-line text-lg leading-9 text-neutral-600">{s.about_text}</p>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="mt-12 rounded-3xl bg-[#f5f5f7] p-8">
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><Truck size={20} className="text-[var(--accent)]" /> سياسة التوصيل</h2>
          <p className="mt-3 whitespace-pre-line leading-8 text-neutral-600">{s.delivery_policy}</p>
        </div>
      </Reveal>
      <Reveal delay={0.2}>
        <div className="mt-6 rounded-3xl bg-[#f5f5f7] p-8">
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><RefreshCcw size={20} className="text-[var(--accent)]" /> سياسة الاستبدال والاسترجاع</h2>
          <p className="mt-3 whitespace-pre-line leading-8 text-neutral-600">{s.returns_policy}</p>
        </div>
      </Reveal>
      <Reveal delay={0.3}>
        <div className="mt-6 rounded-3xl bg-[#f5f5f7] p-8">
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><Store size={20} className="text-[var(--accent)]" /> معلومات التواصل</h2>
          <p className="mt-3 leading-8 text-neutral-600">{s.address} — <span dir="ltr">{s.phone}</span> — {s.email}</p>
          <p className="text-neutral-600">{s.working_hours}</p>
        </div>
      </Reveal>
    </div>
  );
}
