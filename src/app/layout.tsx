import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = getSettings();
  const base = (s.site_url || "").replace(/\/$/, "") || undefined;
  const name = s.store_name || "آي ستور";
  return {
    metadataBase: base ? new URL(base) : undefined,
    title: { default: name, template: `%s | ${name}` },
    description: s.store_tagline,
    openGraph: { title: name, description: s.store_tagline, type: "website", locale: "ar_LY" },
    twitter: { card: "summary_large_image", title: name, description: s.store_tagline },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.classList.toggle('light',t==='light')}catch(e){}`,
          }}
        />
      </head>
      <body className={`${cairo.variable} font-sans`}>{children}</body>
    </html>
  );
}
