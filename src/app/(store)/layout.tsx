import React from "react";
import { CartProvider } from "@/components/store/CartContext";
import { WishlistProvider } from "@/components/store/WishlistContext";
import Analytics from "@/components/store/Analytics";
import Header from "@/components/store/Header";
import BackButton from "@/components/store/BackButton";
import BackToTop from "@/components/store/BackToTop";
import MotionProvider from "@/components/store/MotionProvider";
import Footer from "@/components/store/Footer";
import AnnouncementBar from "@/components/store/AnnouncementBar";
import { readAnnounce, isActive } from "@/lib/announcement";
import crypto from "crypto";
import { getSettings } from "@/lib/settings";
import { getSessionAdmin } from "@/lib/auth";
import { priceOptsFrom, setPriceOpts } from "@/lib/format";
import PriceFormatInit from "@/components/store/PriceFormatInit";
import Maintenance from "@/components/store/Maintenance";
import { getDb } from "@/lib/db";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const s = getSettings();
  const db = getDb();
  // وضع الصيانة: الزوار يرون رسالة الإغلاق، والمشرف المسجّل يتصفح المتجر عادياً
  if (s.maintenance_enabled === "1" && !getSessionAdmin()) {
    return <Maintenance name={s.store_name || "آي ستور"} message={s.maintenance_message || "المتجر مغلق مؤقتاً للصيانة، نعود قريباً."} />;
  }
  const priceOpts = priceOptsFrom(s);
  setPriceOpts(priceOpts);
  const ann = readAnnounce(s);
  const annSig = crypto.createHash("md5").update(JSON.stringify({ m: ann.messages, s: ann.start, e: ann.end })).digest("hex").slice(0, 10);
  const cats = db.prepare("SELECT name, slug FROM categories WHERE active = 1 ORDER BY sort_order").all() as Pick<Category, "name" | "slug">[];
  return (
    <MotionProvider>
    <PriceFormatInit opts={priceOpts} />
    <CartProvider>
      <WishlistProvider>
        <Analytics metaPixel={s.meta_pixel_id || ""} tiktokPixel={s.tiktok_pixel_id || ""} gaId={s.ga_id || ""} />
        {isActive(ann) && <AnnouncementBar config={ann} sig={annSig} />}
        <Header storeName={s.store_name || "آي ستور"} categories={cats} logo={s.intro_logo ? (s.intro_logo.startsWith("data:") ? `/api/logo?v=${crypto.createHash("md5").update(s.intro_logo).digest("hex").slice(0, 10)}` : s.intro_logo) : ""} />
        <BackButton />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
        <BackToTop />
      </WishlistProvider>
    </CartProvider>
    </MotionProvider>
  );
}
