"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Truck, Banknote, Zap, ShieldCheck, Gift, Percent, Clock, Star, Phone, Heart, Sparkles } from "lucide-react";
import type { IntroConfig } from "@/lib/intro";

const ICONS: Record<string, LucideIcon> = {
  truck: Truck, banknote: Banknote, zap: Zap, shield: ShieldCheck, gift: Gift, percent: Percent,
  clock: Clock, star: Star, phone: Phone, heart: Heart,
};

export default function Intro({ cfg }: { cfg: IntroConfig }) {
  const root = useRef<HTMLElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const run = () => {
      raf = 0;
      const h = el.offsetHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / (h * 0.8)));
      if (content.current) {
        content.current.style.opacity = String(Math.max(0, 1 - p * 1.25));
        content.current.style.transform = reduce ? "" : `translate3d(0,${-p * 50}px,0) scale(${1 - p * 0.06})`;
      }
      if (logo.current) {
        logo.current.style.opacity = String((cfg.opacity / 100) * (1 - p));
        logo.current.style.transform = reduce ? "" : `translate3d(0,${p * 90}px,0) scale(${1 + p * 0.25})`;
      }
      if (cue.current) cue.current.style.opacity = String(Math.max(0, 1 - p * 4));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(run); };
    run();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [cfg.opacity]);

  const next = () => {
    const el = root.current;
    if (el) window.scrollTo({ top: el.offsetTop + el.offsetHeight - 70, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const external = /^https?:\/\//i.test(cfg.ctaLink);

  return (
    <section ref={root} className="intro">
      {cfg.logo && <div ref={logo} aria-hidden className="intro-logo" style={{ backgroundImage: `url(${cfg.logo})`, opacity: cfg.opacity / 100 }} />}
      <div ref={content} className="intro-content">
        {cfg.pill && <span className="intro-pill"><Sparkles size={14} /> {cfg.pill}</span>}
        <h1 className="intro-title">{cfg.title}</h1>
        {cfg.tagline && <p className="intro-tagline">{cfg.tagline}</p>}
        {cfg.chips.length > 0 && (
          <ul className="intro-chips">
            {cfg.chips.map((c, i) => {
              const Icon = ICONS[c.icon] || Star;
              return <li key={i} className="intro-chip" style={{ animationDelay: `${0.25 + i * 0.12}s` }}><Icon size={18} className="text-[var(--accent)]" />{c.text}</li>;
            })}
          </ul>
        )}
        {cfg.ctaText && (external
          ? <a href={cfg.ctaLink} target="_blank" rel="noreferrer" className="intro-cta glow-btn">{cfg.ctaText}</a>
          : <Link href={cfg.ctaLink} className="intro-cta glow-btn">{cfg.ctaText}</Link>)}
      </div>
      <button ref={cue} type="button" onClick={next} aria-label="انتقل للأسفل" className="intro-cue">
        <span className="intro-mouse" />
        <span>اسحب للأسفل</span>
      </button>
    </section>
  );
}
