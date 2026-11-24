"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Eye, EyeOff, MessageSquareReply, Loader2, ExternalLink } from "lucide-react";
import DeleteButton from "./DeleteButton";
import { formatDate } from "@/lib/format";
import type { Review } from "@/lib/types";

type Stats = { count: number; hidden: number; avg: number; dist: { stars: number; count: number }[] };
type ProductSummary = { id: number; name: string; slug: string; avg: number; cnt: number };

const chips = [
  { key: "all", label: "الكل" },
  { key: "visible", label: "معروض" },
  { key: "hidden", label: "مخفي" },
  { key: "5", label: "★★★★★" },
  { key: "4", label: "★★★★" },
  { key: "3", label: "★★★" },
  { key: "2", label: "★★" },
  { key: "1", label: "★" },
];

function Stars({ n }: { n: number }) {
  return <span className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={16} className={i <= n ? "text-amber-400" : "text-neutral-200"} fill="currentColor" />)}</span>;
}

export default function ReviewsManager({ reviews, stats, topProducts, bottomProducts }: { reviews: Review[]; stats: Stats; topProducts: ProductSummary[]; bottomProducts: ProductSummary[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [chip, setChip] = useState("all");
  const [sort, setSort] = useState<"recent" | "lowest">("recent");
  const [replyFor, setReplyFor] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = reviews
    .filter((r) => {
      if (chip === "visible" && !r.approved) return false;
      if (chip === "hidden" && r.approved) return false;
      if (["1", "2", "3", "4", "5"].includes(chip) && r.rating !== Number(chip)) return false;
      if (q) {
        const t = q.trim();
        if (!r.customer_name.includes(t) && !(r.product_name || "").includes(t)) return false;
      }
      return true;
    })
    .sort((a, b) => (sort === "lowest" ? a.rating - b.rating || b.id - a.id : b.id - a.id));

  const toggle = async (r: Review) => {
    await fetch(`/api/admin/reviews/${r.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved: !r.approved }) });
    router.refresh();
  };

  const saveReply = async (id: number) => {
    setSaving(true);
    await fetch(`/api/admin/reviews/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reply: replyText }) });
    setSaving(false);
    setReplyFor(null);
    router.refresh();
  };

  const maxDist = Math.max(1, ...stats.dist.map((d) => d.count));

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-neutral-500">متوسط التقييم</p><p className="mt-1 flex items-center gap-1 text-xl font-black"><Star size={17} className="text-amber-400" fill="currentColor" /> {stats.avg}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-neutral-500">عدد التقييمات</p><p className="mt-1 text-xl font-black">{stats.count}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-neutral-500">مخفية</p><p className="mt-1 text-xl font-black">{stats.hidden}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-neutral-500">توزيع النجوم</p>
          <div className="mt-1.5 space-y-0.5">
            {stats.dist.map((d) => (
              <div key={d.stars} className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500">
                <span className="w-2">{d.stars}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-amber-400" style={{ width: `${(d.count / maxDist) * 100}%` }} /></div>
                <span className="w-4 text-left">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(topProducts.length > 0 || bottomProducts.length > 0) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-emerald-600">أعلى المنتجات تقييماً</p>
            {topProducts.map((p) => (
              <a key={p.id} href={`/product/${p.slug}`} target="_blank" className="mt-1.5 flex items-center justify-between gap-2 text-sm hover:underline">
                <span className="min-w-0 truncate font-bold">{p.name}</span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-neutral-500"><Star size={12} className="text-amber-400" fill="currentColor" />{p.avg} ({p.cnt})</span>
              </a>
            ))}
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-red-500">أدنى المنتجات تقييماً</p>
            {bottomProducts.map((p) => (
              <a key={p.id} href={`/product/${p.slug}`} target="_blank" className="mt-1.5 flex items-center justify-between gap-2 text-sm hover:underline">
                <span className="min-w-0 truncate font-bold">{p.name}</span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-neutral-500"><Star size={12} className="text-amber-400" fill="currentColor" />{p.avg} ({p.cnt})</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالزبون أو المنتج…"
          className="w-48 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm outline-none focus:border-black" />
        {chips.map((ch) => (
          <button key={ch.key} onClick={() => setChip(ch.key)}
            className={`rounded-full px-3 py-2 text-xs font-bold transition ${chip === ch.key ? "bg-black text-white" : "bg-white text-neutral-500 shadow-sm hover:text-black"}`}>
            {ch.label}
          </button>
        ))}
        <select value={sort} onChange={(e) => setSort(e.target.value as "recent" | "lowest")}
          className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-bold outline-none">
          <option value="recent">الأحدث</option>
          <option value="lowest">الأدنى تقييماً</option>
        </select>
      </div>

      <div className="mt-4 space-y-3">
        {filtered.length === 0 && <p className="rounded-3xl bg-white p-10 text-center text-sm text-neutral-400 shadow-sm">{reviews.length === 0 ? "لا توجد تقييمات بعد" : "لا نتائج مطابقة"}</p>}
        {filtered.map((r) => (
          <div key={r.id} className={`rounded-3xl bg-white p-5 shadow-sm ${r.approved ? "" : "opacity-70"}`}>
            <div className="flex flex-wrap items-start gap-4">
              <Stars n={r.rating} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-extrabold">
                  {r.customer_name}
                  <a href={`/product/${r.product_slug}`} target="_blank" className="flex items-center gap-1 text-xs font-bold text-sky-600 hover:underline">«{r.product_name}» <ExternalLink size={11} /></a>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${r.approved ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>{r.approved ? "معروض" : "مخفي"}</span>
                </p>
                {r.comment && <p className="mt-1 text-sm text-neutral-600">{r.comment}</p>}
                {r.reply && (
                  <p className="mt-2 rounded-2xl bg-neutral-50 px-4 py-2.5 text-sm text-neutral-700">
                    <span className="font-extrabold">رد المتجر: </span>{r.reply}
                  </p>
                )}
                {replyFor === r.id && (
                  <div className="mt-2 flex items-start gap-2">
                    <textarea autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={2} maxLength={500}
                      placeholder="اكتب ردك — سيظهر في صفحة المنتج تحت التقييم"
                      className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-black" />
                    <button onClick={() => saveReply(r.id)} disabled={saving} className="flex items-center gap-1 rounded-full bg-black px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                      {saving && <Loader2 size={13} className="animate-spin" />} حفظ الرد
                    </button>
                  </div>
                )}
                <p className="mt-1 text-xs text-neutral-400"><span dir="ltr">{r.order_code}</span> — {formatDate(r.created_at)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => { setReplyFor(replyFor === r.id ? null : r.id); setReplyText(r.reply || ""); }} title={r.reply ? "تعديل الرد" : "رد على التقييم"}
                  className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-black hover:text-black">
                  <MessageSquareReply size={15} />
                </button>
                <button onClick={() => toggle(r)} className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${r.approved ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200" : "bg-black text-white"}`}>
                  {r.approved ? <><EyeOff size={13} /> إخفاء</> : <><Eye size={13} /> عرض</>}
                </button>
                <DeleteButton resource="reviews" id={r.id} label={`تقييم ${r.customer_name}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
