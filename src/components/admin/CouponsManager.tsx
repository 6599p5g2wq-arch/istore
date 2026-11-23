"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, TicketPercent, Pencil, X, Copy, Check, Share2 } from "lucide-react";
import DeleteButton from "./DeleteButton";
import { formatPrice } from "@/lib/format";
import type { Coupon } from "@/lib/types";

type C = Coupon & { customer_name?: string | null };
type Stats = { active: number; uses: number; discount: number };
type CustomerOpt = { id: number; name: string; phone: string | null };

const emptyForm = { code: "", kind: "percent", value: "", min_total: "", expires_at: "", starts_at: "", max_uses: "", customer_id: "" };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function statusOf(c: C, today: string) {
  if (!c.active) return { key: "disabled", label: "معطل", cls: "bg-neutral-100 text-neutral-500" };
  if (c.expires_at && c.expires_at < today) return { key: "expired", label: "منتهي", cls: "bg-red-100 text-red-600" };
  if (c.starts_at && c.starts_at > today) return { key: "scheduled", label: "لم يبدأ بعد", cls: "bg-amber-100 text-amber-700" };
  if (c.max_uses > 0 && c.used_count >= c.max_uses) return { key: "usedup", label: "اكتمل استخدامه", cls: "bg-sky-100 text-sky-700" };
  return { key: "active", label: "فعال", cls: "bg-emerald-100 text-emerald-700" };
}

const chips = [
  { key: "all", label: "الكل" },
  { key: "active", label: "فعال" },
  { key: "disabled", label: "معطل" },
  { key: "expired", label: "منتهي" },
  { key: "customer", label: "خاص بزبون" },
];

export default function CouponsManager({ coupons, stats }: { coupons: C[]; stats: Stats }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [chip, setChip] = useState("all");
  const today = useMemo(todayStr, []);

  useEffect(() => {
    fetch("/api/admin/customers").then((r) => (r.ok ? r.json() : { customers: [] })).then((d) => setCustomers(d.customers || [])).catch(() => {});
  }, []);

  const filtered = coupons.filter((c) => {
    if (chip === "customer" ? !c.customer_id : chip !== "all" && statusOf(c, today).key !== chip) return false;
    if (q && !c.code.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form, value: Number(form.value) || 0, min_total: Number(form.min_total) || 0, max_uses: Number(form.max_uses) || 0, customer_id: form.customer_id ? Number(form.customer_id) : null };
    const r = await fetch(editId ? `/api/admin/coupons/${editId}` : "/api/admin/coupons", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (r.ok) { setForm({ ...emptyForm }); setEditId(null); router.refresh(); }
    else { const d = await r.json().catch(() => ({})); alert(d.error || "حدث خطأ"); }
  };

  const startEdit = (c: C) => {
    setEditId(c.id);
    setForm({
      code: c.code, kind: c.kind, value: String(c.value), min_total: c.min_total ? String(c.min_total) : "",
      starts_at: c.starts_at || "", expires_at: c.expires_at || "", max_uses: c.max_uses ? String(c.max_uses) : "",
      customer_id: c.customer_id ? String(c.customer_id) : "",
    });
  };

  const toggle = async (c: C) => {
    await fetch(`/api/admin/coupons/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !c.active }) });
    router.refresh();
  };

  const copyCode = async (c: C) => {
    try { await navigator.clipboard.writeText(c.code); } catch { return; }
    setCopiedId(c.id);
    setTimeout(() => setCopiedId((v) => (v === c.id ? null : v)), 1500);
  };

  const waShare = (c: C) => {
    const discount = c.kind === "percent" ? `خصم ${c.value}%` : `خصم ${formatPrice(c.value)}`;
    const text = `${discount} في آي ستور! استعمل الكود: ${c.code} عند إتمام طلبك`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const inputCls = "mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-black";
  const iconBtn = "grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-black hover:text-black";

  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-neutral-500">كوبونات فعالة</p><p className="mt-1 text-xl font-black">{stats.active}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-neutral-500">إجمالي الاستخدامات</p><p className="mt-1 text-xl font-black">{stats.uses}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-neutral-500">إجمالي الخصم الممنوح</p><p className="mt-1 text-xl font-black">{formatPrice(stats.discount)}</p></div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} dir="ltr" placeholder="بحث بالكود…"
          className="w-44 rounded-full border border-neutral-200 bg-white px-4 py-2 text-left text-sm outline-none focus:border-black" />
        {chips.map((ch) => (
          <button key={ch.key} onClick={() => setChip(ch.key)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${chip === ch.key ? "bg-black text-white" : "bg-white text-neutral-500 shadow-sm hover:text-black"}`}>
            {ch.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {filtered.length === 0 && <p className="rounded-3xl bg-white p-10 text-center text-sm text-neutral-400 shadow-sm">{coupons.length === 0 ? "لا توجد أكواد خصم بعد" : "لا نتائج مطابقة"}</p>}
          {filtered.map((c) => {
            const st = statusOf(c, today);
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-3xl bg-white p-5 shadow-sm">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-black text-white"><TicketPercent size={19} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold" dir="ltr">{c.code}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {c.kind === "percent" ? `خصم ${c.value}%` : `خصم ${formatPrice(c.value)}`}
                    {c.min_total > 0 && ` — حد أدنى ${formatPrice(c.min_total)}`}
                    {c.starts_at && ` — من ${c.starts_at}`}
                    {c.expires_at && ` — حتى ${c.expires_at}`}
                    {` — استُخدم ${c.used_count}${c.max_uses > 0 ? ` من ${c.max_uses}` : " (بلا حد)"}`}
                    {c.customer_id ? ` — خاص بالزبون ${c.customer_name || "#" + c.customer_id}` : ""}
                  </p>
                  {c.max_uses > 0 && (
                    <div className="mt-1.5 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full rounded-full bg-black transition-all" style={{ width: `${Math.min(100, Math.round((c.used_count / c.max_uses) * 100))}%` }} />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => copyCode(c)} title="نسخ الكود" className={iconBtn}>
                    {copiedId === c.id ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  </button>
                  <button onClick={() => waShare(c)} title="مشاركة عبر واتساب" className={iconBtn}><Share2 size={15} /></button>
                  <button onClick={() => startEdit(c)} title="تعديل" className={iconBtn}><Pencil size={15} /></button>
                  <button onClick={() => toggle(c)} className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-600 transition hover:border-black hover:text-black">
                    {c.active ? "تعطيل" : "تفعيل"}
                  </button>
                  <DeleteButton resource="coupons" id={c.id} label={c.code} />
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={save} className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-8">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">{editId ? `تعديل الكوبون ${form.code}` : "إنشاء كود خصم"}</h2>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setForm({ ...emptyForm }); }} className="flex items-center gap-1 text-xs font-bold text-neutral-400 hover:text-black">
                <X size={14} /> إلغاء
              </button>
            )}
          </div>
          <label className="block text-sm font-bold">الكود *<input required dir="ltr" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={`${inputCls} text-left`} placeholder="ISTORE10" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-bold">النوع
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className={inputCls}>
                <option value="percent">نسبة %</option>
                <option value="fixed">مبلغ ثابت</option>
              </select>
            </label>
            <label className="block text-sm font-bold">القيمة *
              <input required type="number" min={1} max={form.kind === "percent" ? 90 : undefined} value={form.value}
                onChange={(e) => {
                  let v = e.target.value;
                  if (form.kind === "percent" && v && Number(v) > 90) v = "90";
                  setForm({ ...form, value: v });
                }} className={inputCls} />
              {form.kind === "percent" && <span className="mt-1 block text-[11px] font-normal text-neutral-400">حتى 90% كحد أقصى</span>}
            </label>
          </div>
          <label className="block text-sm font-bold">حد أدنى للطلب (اختياري)<input type="number" min={0} value={form.min_total} onChange={(e) => setForm({ ...form, min_total: e.target.value })} className={inputCls} placeholder="0" /></label>
          <label className="block text-sm font-bold">أقصى عدد استخدامات (اختياري)<input type="number" min={0} value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className={inputCls} placeholder="0 = بلا حد" /></label>
          <label className="block text-sm font-bold">خاص بزبون (اختياري)
            <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className={inputCls}>
              <option value="">لكل الزبائن</option>
              {customers.map((cu) => <option key={cu.id} value={cu.id}>{cu.name}{cu.phone ? ` — ${cu.phone}` : ""}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold">تاريخ البداية (اختياري)<input type="date" dir="ltr" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className={`${inputCls} text-left`} /></label>
          <label className="block text-sm font-bold">تاريخ الانتهاء (اختياري)<input type="date" dir="ltr" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className={`${inputCls} text-left`} /></label>
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-3 font-bold text-white disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : editId ? <Check size={16} /> : <Plus size={16} />} {editId ? "حفظ التعديلات" : "إنشاء"}
          </button>
        </form>
      </div>
    </div>
  );
}
