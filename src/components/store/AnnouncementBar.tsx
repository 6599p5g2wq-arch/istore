"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { toMs, type AnnounceConfig } from "@/lib/announcement";

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d > 0 ? `${d} يوم ` : ""}${p(h)}:${p(m)}:${p(sec)}`;
}

export default function AnnouncementBar({ config, sig }: { config: AnnounceConfig; sig: string }) {
  const [idx, setIdx] = useState(0);
  const [closed, setClosed] = useState(true); // مخفي حتى نقرأ التفضيل لتجنب الوميض
  const [now, setNow] = useState<number | null>(null);
  const key = `istore-ann-closed-${sig}`;
  const end = toMs(config.end);

  useEffect(() => {
    try { setClosed(config.closable && localStorage.getItem(key) === "1"); } catch { setClosed(false); }
  }, [key, config.closable]);

  useEffect(() => {
    if (config.messages.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % config.messages.length), config.interval * 1000);
    return () => clearInterval(t);
  }, [config.messages.length, config.interval]);

  useEffect(() => {
    if (!config.countdown || end === null) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [config.countdown, end]);

  // انتهت المدة أثناء تصفح الزائر: أخفِ الشريط
  const st = toMs(config.start);
  const expired = now !== null && end !== null && now > end;
  const notYet = now !== null && st !== null && now < st;
  if (closed || expired || notYet) return null;

  const m = config.messages[idx % config.messages.length];
  const text = <span key={idx} className="ann-fade inline-block">{m.text}</span>;
  const showCd = config.countdown && end !== null && now !== null && now <= end;

  return (
    <div style={{ background: config.bg, color: config.color }} className="relative py-2.5 text-center text-xs font-bold sm:text-sm" role="region" aria-label="إعلان">
      <style>{`.ann-fade{animation:annIn .5s ease}@keyframes annIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-10">
        {m.link ? (
          m.link.startsWith("/") ? <Link href={m.link} className="underline-offset-4 hover:underline">{text}</Link>
            : <a href={m.link} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">{text}</a>
        ) : text}
        {showCd && <span dir="rtl" className="rounded-full px-2.5 py-0.5 font-extrabold tabular-nums" style={{ background: "rgba(255,255,255,0.18)" }}>{fmt((end as number) - (now as number))}</span>}
      </div>
      {config.closable && (
        <button
          type="button"
          aria-label="إغلاق"
          onClick={() => { setClosed(true); try { localStorage.setItem(key, "1"); } catch { /* ignore */ } }}
          className="absolute left-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full opacity-80 transition hover:opacity-100 sm:left-4"
          style={{ color: config.color }}
        ><X size={15} /></button>
      )}
    </div>
  );
}
