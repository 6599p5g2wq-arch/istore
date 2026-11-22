"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { formatPrice } from "@/lib/format";

type Hit = { id: number; name: string; slug: string; price: number; image: string };

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) { setQ(""); setHits([]); return; }
    const t = setTimeout(async () => {
      if (!q.trim()) { setHits([]); return; }
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const d = await r.json();
        setHits(d.results || []);
      } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

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
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن منتج… آيفون، سماعة، شاحن" className="flex-1 bg-transparent text-lg text-white outline-none placeholder:text-neutral-600" />
              <button onClick={onClose} aria-label="إغلاق" className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-dim)] hover:bg-[var(--chip)]"><X size={18} /></button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {loading && <p className="p-4 text-sm text-[var(--text-faint)]">جاري البحث…</p>}
              {!loading && q && hits.length === 0 && <p className="p-4 text-sm text-[var(--text-faint)]">لا نتائج مطابقة لـ «{q}»</p>}
              {hits.map((h) => (
                <Link key={h.id} href={`/product/${h.slug}`} onClick={onClose} className="flex items-center gap-3 rounded-2xl p-3 hover:bg-[var(--card)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.image} alt="" className="h-14 w-14 rounded-xl bg-[var(--surface-2)] object-cover" />
                  <span className="flex-1 text-sm font-semibold leading-snug text-[var(--text)]">{h.name}</span>
                  <span className="text-sm font-bold text-[var(--accent)]">{formatPrice(h.price)}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
