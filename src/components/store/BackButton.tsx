"use client";
import React, { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

// زر رجوع للصفحة السابقة (يعتمد على سجل المتصفح الحقيقي) مع بديل آمن عند الدخول المباشر
export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  // عدد التنقلات داخل الموقع منذ فتح الصفحة (document.referrer لا يتغير مع التنقل الداخلي)
  const seen = useRef<string | null>(null);
  const moves = useRef(0);
  useEffect(() => {
    if (seen.current !== null && seen.current !== pathname) moves.current += 1;
    seen.current = pathname;
  }, [pathname]);
  if (pathname === "/") return null;
  const back = () => {
    let sameSite = false;
    try { sameSite = !!document.referrer && new URL(document.referrer).origin === window.location.origin; } catch {}
    if (moves.current > 0 || (window.history.length > 1 && sameSite)) router.back();
    else router.push(pathname.startsWith("/product/") ? "/products" : "/");
  };
  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
      <button
        type="button"
        onClick={back}
        aria-label="الرجوع للصفحة السابقة"
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--chip)] py-2 pe-4 ps-2.5 text-sm font-bold text-[var(--text)] transition hover:-translate-y-0.5 hover:bg-[var(--chip-hover)]"
      >
        <ChevronRight size={18} /> رجوع
      </button>
    </div>
  );
}
