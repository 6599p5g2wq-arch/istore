"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Grid3X3, ShoppingCart, Image, Images, Truck, Users, LogOut, Store, Menu, X, Tag, TicketPercent, Star, BellRing, ShoppingBag, UserRound, Gift, Settings } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "لوحة المعلومات", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/categories", label: "التصنيفات", icon: Grid3X3 },
  { href: "/admin/brands", label: "الماركات", icon: Tag },
  { href: "/admin/orders", label: "الطلبات", icon: ShoppingCart },
  { href: "/admin/customers", label: "الزبائن", icon: UserRound },
  { href: "/admin/leads", label: "السلات المهجورة", icon: ShoppingBag },
  { href: "/admin/coupons", label: "أكواد الخصم", icon: TicketPercent },
  { href: "/admin/loyalty", label: "الولاء و VIP", icon: Gift },
  { href: "/admin/reviews", label: "التقييمات", icon: Star },
  { href: "/admin/stock-alerts", label: "إشعارات التوفر", icon: BellRing },
  { href: "/admin/hero", label: "شرائح الرئيسية", icon: Images },
  { href: "/admin/banners", label: "البنرات الترويجية", icon: Image },
  { href: "/admin/shipping", label: "التوصيل والمدن", icon: Truck },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
  { href: "/admin/admins", label: "المشرفون", icon: Users },
];

const badgeMeta: Record<string, { title: string; cls: string }> = {
  "/admin/orders": { title: "طلبات جديدة", cls: "bg-red-500" },
  "/admin/products": { title: "منتجات مخزونها منخفض", cls: "bg-amber-500" },
  "/admin/reviews": { title: "تقييمات منخفضة معروضة", cls: "bg-red-500" },
};

export default function AdminSidebar({ storeName, username, newOrders = 0, lowStock = 0, lowReviews = 0 }: { storeName: string; username: string; newOrders?: number; lowStock?: number; lowReviews?: number }) {
  const badges: Record<string, number> = { "/admin/orders": newOrders, "/admin/products": lowStock, "/admin/reviews": lowReviews };
  const totalAlerts = newOrders + lowStock;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Refresh counts every minute (server layout recomputes them).
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 60000);
    return () => clearInterval(t);
  }, [router]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const nav = (
    <nav className="flex h-full flex-col bg-neutral-950 text-white">
      <div className="flex items-center gap-2 border-b border-white/10 p-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black"><Store size={19} /></span>
        <div>
          <p className="font-extrabold leading-tight">{storeName}</p>
          <p className="text-xs text-white/50">لوحة التحكم</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={`mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition ${active ? "bg-white text-black" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
              <l.icon size={17} /> <span className="flex-1">{l.label}</span>
              {(badges[l.href] ?? 0) > 0 && (
                <span title={badgeMeta[l.href]?.title} className={`grid min-w-[1.4rem] place-items-center rounded-full px-1.5 py-0.5 text-[11px] font-extrabold leading-none text-white ${badgeMeta[l.href]?.cls ?? "bg-amber-500"}`}>{badges[l.href] > 99 ? "99+" : badges[l.href]}</span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="border-t border-white/10 p-3">
        <Link href="/" target="_blank" className="mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white">
          <Store size={17} /> عرض المتجر
        </Link>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/10">
          <LogOut size={17} /> تسجيل الخروج ({username})
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="القائمة" className="fixed right-4 top-4 z-40 grid h-11 w-11 place-items-center rounded-full bg-black text-white shadow-lg lg:hidden"><Menu size={20} />{totalAlerts > 0 && <span className="absolute -left-1 -top-1 grid min-w-[1.25rem] place-items-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] font-extrabold leading-none text-white">{totalAlerts > 99 ? "99+" : totalAlerts}</span>}</button>
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="absolute inset-y-0 right-0 w-72" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} aria-label="إغلاق" className="absolute left-3 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"><X size={17} /></button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
