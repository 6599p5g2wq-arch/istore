"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import type { HeroSlide } from "@/lib/types";

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const n = slides.length;

  const go = useCallback((d: number) => {
    setDir(d);
    setIndex((i) => (i + d + n) % n);
  }, [n]);

  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [go, n]);

  if (n === 0) return null;
  const s = slides[index];

  return (
    <section className="relative mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-neutral-950 text-white shadow-2xl">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={s.id}
            custom={dir}
            initial={{ opacity: 0, x: dir * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -60 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative grid min-h-[480px] items-center gap-8 p-8 sm:p-14 lg:grid-cols-2"
          >
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[var(--accent)] opacity-20 blur-3xl" />
            <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-purple-600 opacity-20 blur-3xl" />
            <div className="relative z-10 order-2 lg:order-1">
              <motion.span
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold backdrop-blur"
              >
                <Sparkles size={14} /> تشكيلة {new Date().getFullYear()} الجديدة
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7 }}
                className="text-balance whitespace-pre-line text-4xl font-black leading-[1.15] sm:text-5xl lg:text-6xl"
              >
                {s.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.7 }}
                className="mt-5 max-w-md text-base leading-8 text-white/70 sm:text-lg"
              >
                {s.subtitle}
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }} className="mt-8 flex flex-wrap items-center gap-4">
                <Link href={s.cta_link} className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-bold text-black shadow-lg transition hover:scale-[1.03] hover:shadow-xl">
                  {s.cta_text}
                  <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                </Link>
              </motion.div>
            </div>
            <div className="relative z-10 order-1 lg:order-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: 3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="animate-float-slow relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[2rem]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt={s.title} className="h-full w-full object-cover" />
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {n > 1 && (
          <>
            <div className="absolute bottom-6 right-8 z-20 flex gap-2 sm:right-14">
              {slides.map((sl, i) => (
                <button key={sl.id} onClick={() => { setDir(i > index ? 1 : -1); setIndex(i); }} aria-label={`شريحة ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${i === index ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"}`} />
              ))}
            </div>
            <button onClick={() => go(-1)} aria-label="السابق" className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:grid"><ChevronLeft size={20} /></button>
            <button onClick={() => go(1)} aria-label="التالي" className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:grid"><ChevronRight size={20} /></button>
          </>
        )}
      </div>
    </section>
  );
}
