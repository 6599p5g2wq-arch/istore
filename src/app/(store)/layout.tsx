import React from "react";
import { CartProvider } from "@/components/store/CartContext";
import { WishlistProvider } from "@/components/store/WishlistContext";
import Analytics from "@/components/store/Analytics";
import Header from "@/components/store/Header";
import BackToTop from "@/components/store/BackToTop";
import MotionProvider from "@/components/store/MotionProvider";
import Footer from "@/components/store/Footer";
import AnnouncementBar from "@/components/store/AnnouncementBar";
import { readAnnounce, isActive } from "@/lib/announcement";
import crypto from "crypto";
import { getSettings } from "@/lib/settings";
import { getDb } from "@/lib/db";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const s = getSettings();
  const db = getDb();
  const ann = readAnnounce(s);
  const annSig = crypto.createHash("md5").update(JSON.stringify({ m: ann.messages, s: ann.start, e: ann.end })).digest("hex").slice(0, 10);
  const cats = db.prepare("SELECT name, slug FROM categories WHERE active = 1 ORDER BY sort_order").all() as Pick<Category, "name" | "slug">[];
  return (
    <MotionProvider>
    <CartProvider>
      <WishlistProvider>
        <Analytics metaPixel={s.meta_pixel_id || ""} tiktokPixel={s.tiktok_pixel_id || ""} gaId={s.ga_id || ""} />
        {isActive(ann) && <AnnouncementBar config={ann} sig={annSig} />}
        <Header storeName={s.store_name || "آي ستور"} categories={cats} />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
        <BackToTop />
      </WishlistProvider>
    </CartProvider>
    </MotionProvider>
  );
}
