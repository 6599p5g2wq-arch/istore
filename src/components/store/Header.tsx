"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Search, Menu, X, Store, Heart, UserRound } from "lucide-react";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";
import CartDrawer from "./CartDrawer";
import SearchOverlay from "./SearchOverlay";
import ThemeToggle from "./ThemeToggle";

export default function Header({ storeName, categories, logo = "" }: { storeName: string; categories: { name: string; slug: string }[]; logo?: string }) {
  const { count, open, setOpen } = useCart();
  const { count: wishCount } = useWishlist();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "glass shadow-lg shadow-black/30 border-b border-[var(--border)]" : "bg-transparent"}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 font-extrabold text-lg sm:text-xl tracking-tight text-white">
              {logo ? (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--chip)] p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} alt="" className="h-full w-full object-contain" />
                </span>
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--text)] text-[var(--bg)]"><Store size={20} /></span>
              )}
              <span className="max-[360px]:hidden">{storeName}</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[var(--text-dim)]">
              <Link href="/products" className="hover:text-[var(--text)] transition-colors">كل المنتجات</Link>
              <Link href="/brands" className="hover:text-[var(--text)] transition-colors">الماركات</Link>
              {categories.slice(0, 5).map((c) => (
                <Link key={c.slug} href={`/products?category=${c.slug}`} className="hover:text-[var(--text)] transition-colors">{c.name}</Link>
              ))}
            </nav>
            <div className="flex items-center gap-1">
              <div className="hidden sm:block"><ThemeToggle /></div>
              <button onClick={() => setSearch(true)} aria-label="بحث" className="grid h-10 w-10 place-items-center rounded-full text-[var(--text)] hover:bg-[var(--chip)] transition-colors"><Search size={20} /></button>
              <Link href="/wishlist" aria-label="المفضلة" className="relative grid h-10 w-10 place-items-center rounded-full text-[var(--text)] hover:bg-[var(--chip)] transition-colors">
                <Heart size={20} />
                {wishCount > 0 && <span className="absolute -top-0.5 -left-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">{wishCount}</span>}
              </Link>
              <Link href="/account" aria-label="حسابي" className="grid h-10 w-10 place-items-center rounded-full text-[var(--text)] hover:bg-[var(--chip)] transition-colors"><UserRound size={20} /></Link>
              <button onClick={() => setOpen(true)} aria-label="السلة" className="relative grid h-10 w-10 place-items-center rounded-full text-[var(--text)] hover:bg-[var(--chip)] transition-colors">
                <ShoppingBag size={20} />
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -top-0.5 -left-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--accent)] px-1 text-[11px] font-bold text-white">{count}</motion.span>
                  )}
                </AnimatePresence>
              </button>
              <button onClick={() => setMenu(true)} aria-label="القائمة" className="lg:hidden grid h-10 w-10 place-items-center rounded-full text-[var(--text)] hover:bg-[var(--chip)] transition-colors"><Menu size={20} /></button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setMenu(false)}>
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-[var(--surface)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <span className="flex items-center gap-2 font-extrabold text-lg text-white">
                  {logo && (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--chip)] p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo} alt="" className="h-full w-full object-contain" />
                    </span>
                  )}
                  {storeName}
                </span>
                <button onClick={() => setMenu(false)} aria-label="إغلاق" className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-dim)] hover:bg-[var(--chip)]"><X size={18} /></button>
              </div>
              <nav className="flex flex-col gap-1 text-base font-medium">
                <Link onClick={() => setMenu(false)} href="/" className="rounded-lg px-3 py-2.5 text-[var(--text)] hover:bg-[var(--chip)]">الرئيسية</Link>
                <Link onClick={() => setMenu(false)} href="/products" className="rounded-lg px-3 py-2.5 text-[var(--text)] hover:bg-[var(--chip)]">كل المنتجات</Link>
                <Link onClick={() => setMenu(false)} href="/brands" className="rounded-lg px-3 py-2.5 text-[var(--text)] hover:bg-[var(--chip)]">الماركات</Link>
                <div className="my-2 border-t border-[var(--border)]" />
                {categories.map((c) => (
                  <Link key={c.slug} onClick={() => setMenu(false)} href={`/products?category=${c.slug}`} className="rounded-lg px-3 py-2.5 hover:bg-[var(--chip)] text-[var(--text-dim)]">{c.name}</Link>
                ))}
                <div className="my-2 border-t border-[var(--border)]" />
                <Link onClick={() => setMenu(false)} href="/account" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[var(--text)] hover:bg-[var(--chip)]"><UserRound size={18} /> حسابي</Link>
                <Link onClick={() => setMenu(false)} href="/track" className="rounded-lg px-3 py-2.5 hover:bg-[var(--chip)] text-[var(--text-dim)]">تتبع طلبك</Link>
                <div className="mt-2 flex items-center justify-between rounded-lg px-3 py-2.5 text-[var(--text-dim)]">
                  <span>المظهر</span>
                  <ThemeToggle />
                </div>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer open={open} onClose={() => setOpen(false)} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} />
    </>
  );
}
