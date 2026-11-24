"use client";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

/** Meta Pixel, TikTok Pixel, GA4 (when IDs are set in admin settings) + built-in page-view beacon. */
export default function Analytics({ metaPixel, tiktokPixel, gaId }: { metaPixel: string; tiktokPixel: string; gaId: string }) {
  metaPixel = /^\d{5,30}$/.test(metaPixel) ? metaPixel : "";
  tiktokPixel = /^[A-Za-z0-9]{5,40}$/.test(tiktokPixel) ? tiktokPixel : "";
  gaId = /^G-[A-Z0-9]{4,30}$/.test(gaId) ? gaId : "";
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer: document.referrer }),
    }).catch(() => {});
    // SPA pageviews for the pixels
    (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.("track", "PageView");
    (window as unknown as { ttq?: { track: (...a: unknown[]) => void } }).ttq?.track("PageView");
  }, [pathname]);

  return (
    <>
      {metaPixel && (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${metaPixel}'); fbq('track', 'PageView');
        `}</Script>
      )}
      {tiktokPixel && (
        <Script id="tiktok-pixel" strategy="afterInteractive">{`
          !function (w, d, t) { w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript";n.async=!0;n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('${tiktokPixel}');ttq.page()}(window, document, 'ttq');
        `}</Script>
      )}
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date()); gtag('config', '${gaId}');
          `}</Script>
        </>
      )}
    </>
  );
}
