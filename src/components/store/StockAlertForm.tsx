"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { BellRing, Loader2, CheckCircle2 } from "lucide-react";

export default function StockAlertForm({ productId }: { productId: number }) {
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading"); setError("");
    const r = await fetch("/api/stock-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, contact }),
    });
    if (r.ok) { setState("done"); return; }
    const d = await r.json().catch(() => ({}));
    setError(d.error || "حدث خطأ، حاول مرة أخرى");
    setState("error");
  };

  if (state === "done") {
    return (
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400">
        <CheckCircle2 size={17} /> تم! سنخبرك أول ما يتوفر المنتج.
      </motion.p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-[var(--text)]"><BellRing size={16} className="text-[var(--accent)]" /> نفدت الكمية؟ سجل وسنعلمك عند توفره</p>
      <div className="mt-3 flex gap-2">
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="بريدك الإلكتروني أو رقم هاتفك"
          className="flex-1 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-[var(--accent)]"
        />
        <button disabled={state === "loading"} className="glow-btn rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60">
          {state === "loading" ? <Loader2 size={16} className="animate-spin" /> : "أعلمني"}
        </button>
      </div>
      {state === "error" && <p className="mt-2 text-xs font-bold text-red-400">{error}</p>}
    </form>
  );
}
