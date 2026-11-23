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

export const ANN_CSS = `.ann-fade{animation:annIn .5s ease}@keyframes annIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.ann-s{animation:annS .6s cubic-bezier(.22,.8,.3,1)}@keyframes annS{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:none}}
.ann-vwrap{height:1.6em;line-height:1.6em}.ann-v{animation:annV .5s cubic-bezier(.22,.8,.3,1)}@keyframes annV{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:none}}
.ann-track{display:flex;width:max-content;animation:annM linear infinite}.ann-ticker:hover .ann-track{animation-play-state:paused}
.ann-group{display:flex;flex-shrink:0;min-width:100vw;justify-content:space-around}
@keyframes annM{from{transform:translateX(-50%)}to{transform:translateX(0)}}
@media (prefers-reduced-motion:reduce){.ann-track{animation:none}}`;

export default function AnnouncementBar({ config, sig, preview = false }: { config: AnnounceConfig; sig: string; preview?: boolean }) {
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
  if (!preview && (closed || expired || notYet)) return null;

  const showCd = config.countdown && end !== null && now !== null && (preview || now <= end);
  const eff = config.effect;
  const wrap = (m: { text: string; link: string }, k: string, cls = "") => {
    const text = <span key={k} className={cls}>{m.text}</span>;
    if (!m.link) return text;
    return m.link.startsWith("/")
      ? <Link key={k} href={m.link} className="underline-offset-4 hover:underline">{text}</Link>
      : <a key={k} href={m.link} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">{text}</a>;
  };
  const m = config.messages[idx % config.messages.length];
  const chars = config.messages.reduce((n, x) => n + x.text.length, 0);
  const dur = Math.max(14, 10 + chars * 0.5);
  const pill = showCd && <span dir="rtl" className="shrink-0 rounded-full px-2.5 py-0.5 font-extrabold tabular-nums" style={{ background: "rgba(255,255,255,0.18)" }}>{fmt(Math.max(0, (end as number) - (now as number)))}</span>;

  return (
    <div style={{ background: config.bg, color: config.color }} className={`relative py-2.5 text-center text-xs font-bold sm:text-sm ${preview ? "rounded-2xl" : ""}`} role="region" aria-label="إعلان">
      <style>{ANN_CSS}</style>
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-x-4 px-10">
        {eff === "marquee" ? (
          <div dir="ltr" className="ann-ticker min-w-0 flex-1 overflow-hidden">
            <div className="ann-track" style={{ animationDuration: `${dur}s` }}>
              {[0, 1].map((g) => (
                <div key={g} className="ann-group" aria-hidden={g === 1}>
                  {[0, 1, 2].map((r) => config.messages.map((x, i) => (
                    <span key={`${r}-${i}`} dir="rtl" className="mx-8 inline-block whitespace-nowrap">{wrap(x, `m${g}${r}${i}`)}</span>
                  )))}
                </div>
              ))}
            </div>
          </div>
        ) : eff === "vertical" ? (
          <div className="ann-vwrap min-w-0 flex-1 overflow-hidden">{wrap(m, `v${idx}`, "ann-v inline-block")}</div>
        ) : eff === "slide" ? (
          <div className="min-w-0 flex-1 overflow-hidden">{wrap(m, `s${idx}`, "ann-s inline-block")}</div>
        ) : (
          <div className="min-w-0 flex-1">{wrap(m, `f${idx}`, "ann-fade inline-block")}</div>
        )}
        {pill}
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
