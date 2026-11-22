"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Search, Menu, X, Apple, Heart, UserRound } from "lucide-react";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";
import CartDrawer from "./CartDrawer";
import SearchOverlay from "./SearchOverlay";

export default function Header({ storeName, categories }: { storeName: string; categories: { name: string; slug: string }[] }) {
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
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "glass shadow-lg shadow-black/30 border-b border-white/10" : "bg-[#07070d]"}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-white">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black"><Apple size={20} /></span>
              {storeName}
            </Link>
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-neutral-400">
              <Link href="/products" className="hover:text-white transition-colors">كل المنتجات</Link>
              <Link href="/brands" className="hover:text-white transition-colors">الماركات</Link>
              {categories.slice(0, 5).map((c) => (
                <Link key={c.slug} href={`/products?category=${c.slug}`} className="hover:text-white transition-colors">{c.name}</Link>
              ))}
            </nav>
            <div className="flex items-center gap-1">
              <button onClick={() => setSearch(true)} aria-label="بحث" className="grid h-10 w-10 place-items-center rounded-full text-neutral-200 hover:bg-white/10 transition-colors"><Search size={20} /></button>
              <Link href="/wishlist" aria-label="المفضلة" className="relative grid h-10 w-10 place-items-center rounded-full text-neutral-200 hover:bg-white/10 transition-colors">
                <Heart size={20} />
                {wishCount > 0 && <span className="absolute -top-0.5 -left-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">{wishCount}</span>}
              </Link>
              <Link href="/account" aria-label="حسابي" className="hidden sm:grid h-10 w-10 place-items-center rounded-full text-neutral-200 hover:bg-white/10 transition-colors"><UserRound size={20} /></Link>
              <button onClick={() => setOpen(true)} aria-label="السلة" className="relative grid h-10 w-10 place-items-center rounded-full text-neutral-200 hover:bg-white/10 transition-colors">
                <ShoppingBag size={20} />
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -top-0.5 -left-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--accent)] px-1 text-[11px] font-bold text-white">{count}</motion.span>
                  )}
                </AnimatePresence>
              </button>
              <button onClick={() => setMenu(true)} aria-label="القائمة" className="lg:hidden grid h-10 w-10 place-items-center rounded-full text-neutral-200 hover:bg-white/10 transition-colors"><Menu size={20} /></button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setMenu(false)}>
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-[#0e0e16] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-extrabold text-lg text-white">{storeName}</span>
                <button onClick={() => setMenu(false)} aria-label="إغلاق" className="grid h-9 w-9 place-items-center rounded-full text-neutral-300 hover:bg-white/10"><X size={18} /></button>
              </div>
              <nav className="flex flex-col gap-1 text-base font-medium">
                <Link onClick={() => setMenu(false)} href="/" className="rounded-lg px-3 py-2.5 text-neutral-100 hover:bg-white/10">الرئيسية</Link>
                <Link onClick={() => setMenu(false)} href="/products" className="rounded-lg px-3 py-2.5 text-neutral-100 hover:bg-white/10">كل المنتجات</Link>
                <Link onClick={() => setMenu(false)} href="/brands" className="rounded-lg px-3 py-2.5 text-neutral-100 hover:bg-white/10">الماركات</Link>
                <div className="my-2 border-t border-white/10" />
                {categories.map((c) => (
                  <Link key={c.slug} onClick={() => setMenu(false)} href={`/products?category=${c.slug}`} className="rounded-lg px-3 py-2.5 hover:bg-white/10 text-neutral-400">{c.name}</Link>
                ))}
                <div className="my-2 border-t border-white/10" />
                <Link onClick={() => setMenu(false)} href="/track" className="rounded-lg px-3 py-2.5 hover:bg-white/10 text-neutral-400">تتبع طلبك</Link>
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
