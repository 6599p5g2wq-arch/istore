import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { iconHash } from "@/lib/favicon";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = getSettings();
  const base = (s.site_url || "").replace(/\/$/, "") || undefined;
  const name = s.store_name || "آي ستور";
  const logo = s.intro_logo || "";
  const h = logo ? iconHash() : "";
  const icons = logo
    ? { icon: [{ url: `/api/logo/icon?s=32&v=${h}`, sizes: "32x32", type: "image/png" }, { url: `/api/logo/icon?s=192&v=${h}`, sizes: "192x192", type: "image/png" }], shortcut: `/favicon.ico?v=${h}`, apple: [{ url: `/api/logo/icon?s=180&v=${h}`, sizes: "180x180", type: "image/png" }] }
    : undefined;
  return {
    ...(icons ? { icons } : {}),
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
            __html: `try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.classList.toggle('light',t==='light');var m=document.querySelector('meta[name=theme-color]');if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m)}m.content=t==='light'?'#eef1fb':'#12082e';}catch(e){}`,
          }}
        />
      </head>
      <body className={`${cairo.variable} font-sans`}>{children}</body>
    </html>
  );
}
