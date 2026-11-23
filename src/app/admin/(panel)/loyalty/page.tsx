import React from "react";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getProgram, isVip } from "@/lib/loyalty";
import { formatPrice, formatDate } from "@/lib/format";
import ProgramPanel from "@/components/admin/ProgramPanel";
import LoyaltySimulator from "@/components/admin/LoyaltySimulator";

export const dynamic = "force-dynamic";

type TopRow = { id: number; name: string; points: number; vip_override: number | null; spent: number };
type LogRow = { id: number; delta: number; reason: string; order_id: number | null; created_at: string; name: string };

export default function AdminLoyalty() {
  const db = getDb();
  const p = getProgram(db);

  const stats = {
    withPoints: (db.prepare("SELECT COUNT(*) AS c FROM customers WHERE points > 0").get() as { c: number }).c,
    totalPoints: (db.prepare("SELECT COALESCE(SUM(points), 0) AS s FROM customers").get() as { s: number }).s,
    redeemed: (db.prepare("SELECT COALESCE(SUM(points_discount), 0) AS s FROM orders").get() as { s: number }).s,
  };

  const spend = "COALESCE((SELECT SUM(o.total) FROM orders o WHERE o.customer_id = c.id AND o.status != 'cancelled'), 0)";
  const top = db.prepare(`SELECT c.id, c.name, c.points, c.vip_override, ${spend} AS spent FROM customers c ORDER BY c.points DESC, spent DESC LIMIT 8`).all() as TopRow[];
  const vipCount = (db.prepare(`SELECT COUNT(*) AS c FROM customers c WHERE c.vip_override = 1 OR (c.vip_override IS NULL AND ${spend} >= ?)`).get(p.vip.threshold) as { c: number }).c;

  const nearVip = (db.prepare(
    `SELECT c.id, c.name, ${spend} AS spent FROM customers c
     WHERE c.vip_override IS NULL AND ${spend} >= ? AND ${spend} < ? ORDER BY spent DESC LIMIT 8`
  ).all(Math.round(p.vip.threshold * 0.7), p.vip.threshold) as { id: number; name: string; spent: number }[]);

  const log = db.prepare(
    "SELECT pl.id, pl.delta, pl.reason, pl.order_id, pl.created_at, c.name FROM points_log pl JOIN customers c ON c.id = pl.customer_id ORDER BY pl.id DESC LIMIT 15"
  ).all() as LogRow[];

  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">الولاء و VIP</h1>
      <p className="mt-1 text-sm text-neutral-500">نقاط على الطلبات المكتملة يستبدلها الزبون بخصم، وشارة VIP لأفضل الزبائن</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-neutral-500">زبائن لديهم نقاط</p><p className="mt-1 text-xl font-black">{stats.withPoints}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-neutral-500">إجمالي النقاط القائمة</p><p className="mt-1 text-xl font-black">{stats.totalPoints.toLocaleString("en")}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-neutral-500">زبائن VIP</p><p className="mt-1 text-xl font-black">{vipCount}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-neutral-500">خصومات نقاط مستبدلة</p><p className="mt-1 text-xl font-black">{formatPrice(stats.redeemed)}</p></div>
      </div>

      <div className="mt-6 grid max-w-4xl gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <ProgramPanel group="loyalty" title="نقاط الولاء" desc="تُمنح النقاط عند تحويل الطلب إلى «تم التوصيل»، ويستبدلها الزبون عند إتمام الطلب."
            enabled={p.loyalty.enabled}
            values={{ loyalty_per_lyd: p.loyalty.perLyd, loyalty_redeem_points: p.loyalty.redeemPoints, loyalty_redeem_value: p.loyalty.redeemValue }}
            fields={[
              { key: "loyalty_per_lyd", label: "نقاط لكل 1 د.ل", hint: "الافتراضي: 1", step: 0.01 },
              { key: "loyalty_redeem_points", label: "عدد النقاط للاستبدال", hint: "الافتراضي: 100" },
              { key: "loyalty_redeem_value", label: "قيمة الخصم (د.ل)", hint: "الافتراضي: 5 د.ل مقابل 100 نقطة", step: 0.01 },
            ]} />
          <LoyaltySimulator perLyd={p.loyalty.perLyd} redeemPoints={p.loyalty.redeemPoints} redeemValue={p.loyalty.redeemValue} />
        </div>
        <ProgramPanel group="vip" title="زبون VIP" desc="يُوسم الزبون تلقائياً عند بلوغ حد الإنفاق (طلبات غير ملغاة)، ويمكنك تفعيله أو إلغاءه يدوياً من صفحة الزبون."
          enabled={p.vip.enabled}
          values={{ vip_threshold: p.vip.threshold }}
          fields={[{ key: "vip_threshold", label: "حد الإنفاق (د.ل)", hint: "الافتراضي: 2000" }]} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-extrabold">أفضل الزبائن بالنقاط</h2>
          {top.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">لا زبائن بعد</p>}
          <div className="mt-3 space-y-2">
            {top.map((c, i) => {
              const vip = isVip(c.spent, c.vip_override, p);
              return (
                <Link key={c.id} href={`/admin/customers/${c.id}`} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-neutral-50">
                  <span className="w-5 text-center text-sm font-black text-neutral-300">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{c.name} {vip && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">★ VIP</span>}</span>
                  <span className="text-xs text-neutral-400">{formatPrice(c.spent)}</span>
                  <span className="text-sm font-black">{c.points.toLocaleString("en")} نقطة</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-extrabold">قريبون من VIP</h2>
          <p className="mt-1 text-xs text-neutral-500">أنفقوا 70% أو أكثر من الحد ({formatPrice(p.vip.threshold)}){p.vip.enabled ? "" : " — برنامج VIP متوقف حالياً"}</p>
          {nearVip.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">لا أحد قريب من الحد</p>}
          <div className="mt-3 space-y-3">
            {nearVip.map((c) => (
              <Link key={c.id} href={`/admin/customers/${c.id}`} className="block rounded-2xl px-3 py-2 transition hover:bg-neutral-50">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">{c.name}</span>
                  <span className="text-xs text-neutral-500">{formatPrice(c.spent)} من {formatPrice(p.vip.threshold)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, Math.round((c.spent / p.vip.threshold) * 100))}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-extrabold">آخر حركات النقاط</h2>
        {log.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">لا حركات نقاط بعد</p>}
        {log.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="text-right text-xs text-neutral-400"><th className="pb-2 font-bold">الزبون</th><th className="pb-2 font-bold">النقاط</th><th className="pb-2 font-bold">السبب</th><th className="pb-2 font-bold">الطلب</th><th className="pb-2 font-bold">التاريخ</th></tr></thead>
              <tbody>
                {log.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-100">
                    <td className="py-2.5 font-bold">{r.name}</td>
                    <td className={`py-2.5 font-black ${r.delta >= 0 ? "text-emerald-600" : "text-red-500"}`} dir="ltr">{r.delta >= 0 ? "+" : ""}{r.delta}</td>
                    <td className="py-2.5 text-neutral-600">{r.reason}</td>
                    <td className="py-2.5 text-neutral-400">{r.order_id ? `#${r.order_id}` : "—"}</td>
                    <td className="py-2.5 text-xs text-neutral-400">{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
