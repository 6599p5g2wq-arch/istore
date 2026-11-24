"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { formatPrice } from "@/lib/format";

type Hit = { id: number; name: string; slug: string; price: number; image: string };

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,setError]=useState("");

  const sequence=useRef(0);
  useEffect(() => {
    const seq=++sequence.current;
    if (!open) { setQ(""); setHits([]); setLoading(false); return; }
    setHits([]);setError("");setLoading(!!q.trim());
    const controller=new AbortController();
    const t = setTimeout(async () => {
      if (!q.trim()) { setHits([]); setLoading(false); return; }
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`,{signal:controller.signal});
        if(!r.ok)throw new Error("search");
        const d = await r.json();
        if(seq===sequence.current)setHits(d.results || []);
      } catch(e) {if(!(e instanceof DOMException&&e.name==="AbortError")&&seq===sequence.current){setHits([]);setError("تعذر البحث الآن. اضغط Enter لفتح صفحة المنتجات.");}} finally { if(seq===sequence.current)setLoading(false); }
    }, 250);
  return () => {clearTimeout(t);controller.abort();};
  }, [q, open]);
useEffect(()=>{if(!open)return;const f=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();};document.addEventListener("keydown",f);return()=>document.removeEventListener("keydown",f);},[open,onClose]);


  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 p-4" onClick={onClose}>
          <motion.div
            initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="mx-auto mt-20 w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl" onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
              <Search size={20} className="text-[var(--text-faint)]" />
              <input autoFocus maxLength={120} onKeyDown={e=>{if(e.key==="Enter"&&q.trim())window.location.href="/products?q="+encodeURIComponent(q.trim());}} value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن منتج… آيفون، سماعة، شاحن" className="min-w-0 flex-1 bg-transparent text-lg text-white outline-none placeholder:text-[var(--text-dim)] placeholder:opacity-90" />
              <button onClick={onClose} aria-label="إغلاق" className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-dim)] hover:bg-[var(--chip)]"><X size={18} /></button>
            </div>
            <div className="max-h-[min(65dvh,32rem)] overflow-y-auto space-y-2 p-3">
              {loading && <p className="p-4 text-sm text-[var(--text-faint)]">جاري البحث…</p>}
              {!loading && !error && q && hits.length === 0 && <p className="p-4 text-sm text-[var(--text-faint)]">لا نتائج مطابقة لـ «{q}»</p>}
              {error && <p role="alert" className="p-4 text-sm text-red-400">{error}</p>}
              {hits.map((h) => (
                <Link key={h.id} href={`/product/${h.slug}`} onClick={onClose} className="flex items-center gap-3 rounded-2xl bg-[var(--card)] px-3 py-3.5 hover:bg-[var(--chip)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.image} alt="" className="h-14 w-14 rounded-xl bg-[var(--surface-2)] object-cover" />
                  <span className="min-w-0 flex-1 text-sm font-semibold leading-[1.65] text-[var(--text)]">{h.name}</span>
                  <span className="shrink-0 whitespace-nowrap text-sm font-bold text-[var(--accent)]">{formatPrice(h.price)}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
