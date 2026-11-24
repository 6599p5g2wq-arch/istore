"use client";
import { useEffect, useRef } from "react";
import type { HeroSlide } from "@/lib/types";
import { initHeroMotion } from "../../../public/hero-motion.js";
import "./hero-slider.css";

export default function HeroSlider({ slides, asH2 = false }: { slides: HeroSlide[]; asH2?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const Title = asH2 ? "h2" : "h1";
  useEffect(() => {
    if (root.current) return initHeroMotion(root.current);
  }, [slides]);
  if (!slides.length) return null;
  const cards = slides.length > 1 ? [slides[slides.length - 1], ...slides, slides[0]] : slides;
  return <section ref={root} className="hero-rail on-dark" aria-roledescription="عرض شرائح" aria-label="عروض المتجر">
    <div className="hp-clip">
      <div className="hp-track" aria-hidden="true">
        {cards.map((slide, i) => <article className="hp-card" key={`${slide.id}-${i}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.image} alt="" draggable={false} />
        </article>)}
      </div>
      <div className="hp-overlay">
        {slides.map((slide, i) => <div className="hp-copy" data-copy={i} data-label={slide.cta_text} data-href={slide.cta_link} key={slide.id} aria-hidden={i !== 0}>
          <Title>{slide.title}</Title><p>{slide.subtitle}</p><div className="hp-cta-space" aria-hidden="true">&nbsp;</div>
        </div>)}
        <div className="hp-copy hp-fixed-button"><a href={slides[0].cta_link}>{slides[0].cta_text}</a></div>
      </div>
      {slides.length > 1 && <><button type="button" data-go="-1" className="hp-arrow prev" aria-label="السابق">‹</button><button type="button" data-go="1" className="hp-arrow next" aria-label="التالي">›</button></>}
    </div>
    {slides.length > 1 && <div className="hp-dots">{slides.map((slide, i) => <button type="button" key={slide.id} data-dot={i} className={i === 0 ? "active" : ""} aria-label={`شريحة ${i + 1}`} />)}</div>}
  </section>;
}
