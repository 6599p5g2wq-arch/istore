"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Grid3X3, ShoppingCart, Image, Images, Truck, Settings, Users, LogOut, Store, Menu, X, Apple, TicketPercent, Star, BellRing, ShoppingBag } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "لوحة المعلومات", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/categories", label: "التصنيفات", icon: Grid3X3 },
  { href: "/admin/orders", label: "الطلبات", icon: ShoppingCart },
  { href: "/admin/leads", label: "السلات المهجورة", icon: ShoppingBag },
  { href: "/admin/coupons", label: "أكواد الخصم", icon: TicketPercent },
  { href: "/admin/reviews", label: "التقييمات", icon: Star },
  { href: "/admin/stock-alerts", label: "إشعارات التوفر", icon: BellRing },
  { href: "/admin/hero", label: "شرائح الرئيسية", icon: Images },
  { href: "/admin/banners", label: "البنرات الترويجية", icon: Image },
  { href: "/admin/shipping", label: "التوصيل والمدن", icon: Truck },
  { href: "/admin/settings", label: "إعدادات المتجر", icon: Settings },
  { href: "/admin/admins", label: "المشرفون", icon: Users },
];

export default function AdminSidebar({ storeName, username }: { storeName: string; username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const nav = (
    <nav className="flex h-full flex-col bg-neutral-950 text-white">
      <div className="flex items-center gap-2 border-b border-white/10 p-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black"><Apple size={19} /></span>
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
              <l.icon size={17} /> {l.label}
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
      <button onClick={() => setOpen(true)} aria-label="القائمة" className="fixed right-4 top-4 z-40 grid h-11 w-11 place-items-center rounded-full bg-black text-white shadow-lg lg:hidden"><Menu size={20} /></button>
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
