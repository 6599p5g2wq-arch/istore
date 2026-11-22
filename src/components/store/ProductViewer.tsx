"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";
import { RotateCw } from "lucide-react";

/**
 * Interactive 3D product viewer: drag to rotate the product in 3D perspective.
 * Springs back to rest on release. Pointer-driven only (no scroll hijack).
 */
export default function ProductViewer({ src, alt, badge, discount }: { src: string; alt: string; badge?: string | null; discount: number }) {
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, { stiffness: 140, damping: 15 });
  const rotateY = useSpring(0, { stiffness: 140, damping: 15 });
  const [overrideSrc, setOverrideSrc] = useState("");

  // Variant selections can swap the main image (e.g. per-color photos).
  useEffect(() => {
    const onSwap = (e: Event) => setOverrideSrc(String((e as CustomEvent).detail || ""));
    window.addEventListener("variant-image", onSwap);
    return () => window.removeEventListener("variant-image", onSwap);
  }, []);

  const apply = (clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    rotateY.set(((clientX - r.left) / r.width - 0.5) * 55);
    rotateX.set(((clientY - r.top) / r.height - 0.5) * -32);
  };

  return (
    <div
      ref={wrapRef}
      onPointerDown={(e) => { draggingRef.current = true; setDragging(true); e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => { if (draggingRef.current) apply(e.clientX, e.clientY); }}
      onPointerUp={() => { draggingRef.current = false; setDragging(false); rotateX.set(0); rotateY.set(0); }}
      onPointerCancel={() => { draggingRef.current = false; setDragging(false); rotateX.set(0); rotateY.set(0); }}
      className={`relative select-none overflow-hidden rounded-[2rem] bg-[var(--surface-2)] ring-1 ring-white/10 ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{ perspective: 1100 }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={{ scale: dragging ? 1.05 : 1 }}
        transition={{ duration: 0.25 }}
        className={dragging ? "drop-shadow-[0_30px_40px_rgba(0,0,0,.5)]" : ""}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={overrideSrc || src} alt={alt} draggable={false} className="aspect-square w-full object-cover" />
      </motion.div>
      {badge && <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black">{badge}</span>}
      {discount > 0 && <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-red-500 px-4 py-1.5 text-xs font-bold text-white">خصم {discount}%</span>}
      <span className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/70 px-4 py-2 text-xs font-bold text-white backdrop-blur">
        <RotateCw size={13} /> اسحب للتدوير 360°
      </span>
    </div>
  );
}
