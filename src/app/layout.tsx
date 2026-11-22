import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = getSettings();
  return { title: { default: s.store_name || "آي ستور", template: `%s | ${s.store_name || "آي ستور"}` }, description: s.store_tagline };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-sans`}>{children}</body>
    </html>
  );
}
