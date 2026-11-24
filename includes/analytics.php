<?php
$metaPixel=setting('meta_pixel_id','');if(!preg_match('/^\d{5,30}$/',$metaPixel))$metaPixel='';
$tiktokPixel=setting('tiktok_pixel_id','');if(!preg_match('/^[A-Za-z0-9]{5,40}$/',$tiktokPixel))$tiktokPixel='';
$gaId=setting('ga_id','');if(!preg_match('/^G-[A-Z0-9]{4,30}$/',$gaId))$gaId='';
?>
<script>fetch(<?=json_encode(url('api/analytics.php'))?>,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:location.pathname,referrer:document.referrer})}).catch(function(){});</script>
<?php if($metaPixel):?><script>          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '<?=$metaPixel?>'); fbq('track', 'PageView');
</script><?php endif;?>
<?php if($tiktokPixel):?><script>          !function (w, d, t) { w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript";n.async=!0;n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('<?=$tiktokPixel?>');ttq.page()}(window, document, 'ttq');
</script><?php endif;?>
<?php if($gaId):?><script async src="https://www.googletagmanager.com/gtag/js?id=<?=$gaId?>"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',<?=json_encode($gaId)?>);</script><?php endif;?>
