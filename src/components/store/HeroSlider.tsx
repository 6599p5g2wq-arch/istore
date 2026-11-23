"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, animate } from "framer-motion";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import type { HeroSlide } from "@/lib/types";

export default function HeroSlider({ slides, asH2 = false }: { slides: HeroSlide[]; asH2?: boolean }) {
  const Title = asH2 ? motion.h2 : motion.h1;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const n = slides.length;

  // Cinematic scroll: the headline drifts and fades gently as you scroll.
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0.2]);

  const go = useCallback((d: number) => {
    setDir(d);
    setIndex((i) => (i + d + n) % n);
  }, [n]);

  // Finger swipe (touch only). touch-action: pan-y keeps vertical page scroll native; horizontal moves are ours.
  const dragX = useMotionValue(0);
  const touch = useRef<{ id: number; x: number; y: number; t: number; mode: "" | "h" | "v" } | null>(null);
  const lastAct = useRef(0);
  const moved = useRef(false);
  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" || n < 2) return;
    touch.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), mode: "" };
    moved.current = false; lastAct.current = Date.now();
  };
  const onMove = (e: React.PointerEvent) => {
    const t = touch.current;
    if (!t || t.id !== e.pointerId) return;
    const dx = e.clientX - t.x, dy = e.clientY - t.y;
    if (!t.mode) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      t.mode = Math.abs(dx) > Math.abs(dy) * 1.2 ? "h" : "v";
    }
    if (t.mode !== "h") return;
    moved.current = true; lastAct.current = Date.now();
    // rubber-band: the farther you drag, the more resistance
    dragX.set(Math.sign(dx) * Math.min(160, Math.abs(dx) * 0.6));
  };
  const onUp = (e: React.PointerEvent) => {
    const t = touch.current;
    if (!t || t.id !== e.pointerId) return;
    touch.current = null;
    if (t.mode !== "h") return;
    const dx = e.clientX - t.x;
    const v = Math.abs(dx) / Math.max(1, performance.now() - t.t); // px per ms
    lastAct.current = Date.now();
    // dragging the content left shows the next slide, right the previous (same direction as the slide animation)
    if (Math.abs(dx) > 55 || (v > 0.45 && Math.abs(dx) > 24)) go(dx < 0 ? 1 : -1);
    animate(dragX, 0, { duration: 0.5, ease: [0.22, 1, 0.36, 1] });
  };

  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => { if (Date.now() - lastAct.current > 4000 && !touch.current) go(1); }, 6000);
    return () => clearInterval(t);
  }, [go, n]);

  if (n === 0) return null;
  const s = slides[index];

  return (
    <section ref={sectionRef} className="relative mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <div
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onClickCapture={(e) => { if (moved.current) { e.preventDefault(); e.stopPropagation(); moved.current = false; } }}
        style={{ touchAction: "pan-y", isolation: "isolate" }}
        className="on-dark relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#140b30]/85 text-white shadow-[0_30px_90px_-20px_rgba(123,47,247,.45)] backdrop-blur-xl">
        {/* Static ambience: lives outside the animated slide so it never re-mounts or ghosts during transitions */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-[34rem] w-[34rem]" style={{ background: "radial-gradient(closest-side, rgba(0,198,255,.28), transparent)" }} />
        <div className="pointer-events-none absolute -bottom-52 -right-32 h-[34rem] w-[34rem]" style={{ background: "radial-gradient(closest-side, rgba(147,51,234,.3), transparent)" }} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={s.id}
            style={{ x: dragX }}
            custom={dir}
            initial={{ opacity: 0, x: dir * 36, scale: 0.99 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: dir * -36, scale: 0.99 }}
            transition={{ duration: 0.85, ease: [0.32, 0.72, 0, 1] }}
            className="relative z-10 grid min-h-[540px] items-center gap-8 p-8 sm:p-14 lg:min-h-[640px] lg:grid-cols-2"
          >
            <motion.div style={{ y: textY, opacity: fade }} className="relative z-10 order-2 lg:order-1">
              <motion.span
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold backdrop-blur"
              >
                <Sparkles size={14} /> تشكيلة {new Date().getFullYear()} الجديدة
              </motion.span>
              <Title
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7 }}
                className="text-balance whitespace-pre-line text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl lg:text-7xl"
              >
                {s.title}
              </Title>
              <motion.p
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.7 }}
                className="mt-5 max-w-md text-base leading-8 text-white/70 sm:text-lg"
              >
                {s.subtitle}
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }} className="mt-8 flex flex-wrap items-center gap-4">
                <Link href={s.cta_link} className="glow-btn group inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-bold transition hover:scale-[1.03]">
                  {s.cta_text}
                  <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                </Link>
              </motion.div>
            </motion.div>
            <div className="relative z-10 order-1 lg:order-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
                className="relative mx-auto aspect-square w-full max-w-md rounded-[2rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)]"
              >
                <div className="h-full w-full overflow-hidden rounded-[2rem]" style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)", transform: "translateZ(0)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image} alt={s.title} draggable={false} className="h-full w-full rounded-[2rem] object-cover" />
                </div>
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
