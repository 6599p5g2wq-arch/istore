/* آي ستور — منطق الواجهة (بدون أي مكتبات خارجية) */
(function () {
  'use strict';

  window.escapeHtml = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };
  window.safeImageUrl = function(value) { var s=String(value||''); if(/[\u0000-\u0020]/.test(s))return ''; if(/^https?:\/\//i.test(s)||/^\/(?!\/)/.test(s)||/^(?:images|uploads)\//.test(s))return window.escapeHtml(s);return ''; };
  function cleanCartItem(i) {if(!i||!Number.isSafeInteger(Number(i.id))||Number(i.id)<1)return null;return {id:Number(i.id),variant_id:Math.max(0,Math.floor(Number(i.variant_id)||0)),name:String(i.name||''),variant_label:String(i.variant_label||''),price:Math.max(0,Number(i.price)||0),qty:Math.max(1,Math.min(99,Math.floor(Number(i.qty)||1))),stock:Math.max(0,Math.floor(Number(i.stock)||0)),image:String(i.image||''),slug:String(i.slug||'')};}
  // ---------- الثيم (ليلي/نهاري) ----------
  window.applyTheme = function (t) {
    document.documentElement.classList.toggle('light', t === 'light');
    var m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', t === 'light' ? '#eef1fb' : '#12082e');
    try { localStorage.setItem('theme', t); } catch (e) {}
    document.querySelectorAll('[data-theme-icon]').forEach(function (el) {
      el.innerHTML = (window.THEME_ICONS||{})[t==='light'?'moon':'sun']||'';
    });
  };
  window.toggleTheme = function () {
    var t = document.documentElement.classList.contains('light') ? 'dark' : 'light';
    window.applyTheme(t);
  };

  // ---------- السلة والمفضلة (localStorage) ----------
  function readStore(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
  }
  function writeStore(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  // Import the Next-format cart when both versions share an origin. Keep the PHP key for existing carts.
  try {
  if(!localStorage.getItem('istore-cart')&&localStorage.getItem('istore_cart'))writeStore('istore-cart',readStore('istore_cart'));
  if(!localStorage.getItem('istore-wishlist')&&Array.isArray(readStore('istore_wishlist')))writeStore('istore-wishlist',readStore('istore_wishlist').map(function(i){return Number(i.id)}).filter(Boolean));
  } catch(e) {}
  var Cart = {
    items: (Array.isArray(readStore('istore-cart'))?readStore('istore-cart'):[]).map(cleanCartItem).filter(Boolean),
    save: function () { writeStore('istore-cart', this.items); this.renderBadge(); },
    key: function (i) { return Number(i.id) + ':' + (Number(i.variant_id) || 0); },
    add: function (p, qty) {
      p=cleanCartItem(p);if(!p)return;
      qty = Math.max(1,Math.min(99,Math.floor(Number(qty)||1)));
      var k = this.key(p);
      var found = null;
      this.items.forEach(function (i) { if (Cart.key(i) === k) found = i; });
      if (found) found.qty = Math.min(found.qty + qty, p.stock || 99);
      else this.items.push({ id: p.id, name: p.name, price: p.price, image: p.image, slug: p.slug, stock: p.stock, variant_id: p.variant_id || 0, variant_label: p.variant_label || '', qty: qty });
      this.save();
      this.openDrawer();
    },
    setQty: function (key, qty) {
      if(qty<=0){this.remove(key);return;}
      this.items.forEach(function(i){if(Cart.key(i)===key)i.qty=Math.min(qty,i.stock||99);});
      this.save(); this.renderDrawer();
      if (typeof window.renderCartPage === 'function') window.renderCartPage();
    },
    remove: function (key) {
      this.items = this.items.filter(function (i) { return Cart.key(i) !== key; });
      this.save(); this.renderDrawer();
      if (typeof window.renderCartPage === 'function') window.renderCartPage();
    },
    clear: function () { this.items = []; this.save(); this.renderDrawer(); },
    count: function () { return this.items.reduce(function (s, i) { return s + i.qty; }, 0); },
    total: function () { return this.items.reduce(function (s, i) { return s + i.qty * i.price; }, 0); },
    renderBadge: function () {
      var c = this.count();
      document.querySelectorAll('[data-cart-count]').forEach(function (el) {
        el.textContent = c;
        el.classList.toggle('hidden', c === 0);
        el.classList.remove('cart-count-pop');
        void el.offsetWidth;
        el.classList.add('cart-count-pop');
      });
    },
    openDrawer: function () {
      this.renderDrawer();
      var ov = document.getElementById('cart-drawer');
      if (ov) { ov.classList.add('open'); document.body.style.overflow = 'hidden'; }
    },
    closeDrawer: function () {
      var ov = document.getElementById('cart-drawer');
      if (ov) { ov.classList.remove('open'); document.body.style.overflow = ''; }
    },
    renderDrawer: function () {
      var box = document.getElementById('cart-drawer-items');
      if (!box) return;
      var cur = window.CURRENCY || 'د.ل';
      var fmt = window.fmtPrice;
      if (!this.items.length) {
        box.innerHTML = '<div class="flex h-full flex-col items-center justify-center gap-3 text-[var(--text-dim)]">'+(window.CART_DRAWER_ICONS||{}).bag+'<p class="font-medium">سلتك فارغة</p><a href="'+window.BASE+'/products.php" class="mt-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-neutral-200 transition-colors">ابدأ التسوق</a></div>';
      } else {
        box.innerHTML = this.items.map(function (i) {
          return '<div class="flex gap-3 rounded-2xl border border-[var(--border)] bg-white/[0.04] p-3">'
            + '<a href="' + window.BASE + '/product.php?slug=' + encodeURIComponent(i.slug) + '" class="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-2)]"><img src="' + window.safeImageUrl(i.image) + '" alt="" class="h-full w-full object-cover"></a>'
            + '<div class="flex min-w-0 flex-1 flex-col">'
            + '<a href="' + window.BASE + '/product.php?slug=' + encodeURIComponent(i.slug) + '" class="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text)]">' + window.escapeHtml(i.name) + '</a>'
            + (i.variant_label ? '<span class="mt-0.5 text-xs font-bold text-[var(--text-faint)]">' + window.escapeHtml(i.variant_label) + '</span>' : '')
            + '<div class="mt-auto flex items-center justify-between pt-2">'
            + '<div class="flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-1 py-0.5">'
            + '<button onclick="Cart.setQty(\'' + Cart.key(i) + '\',' + (i.qty + 1) + ')" class="grid h-6 w-6 place-items-center rounded-full hover:bg-[var(--chip)]">+</button>'
            + '<span class="w-5 text-center text-sm font-bold text-white">' + i.qty + '</span>'
            + '<button onclick="Cart.setQty(\'' + Cart.key(i) + '\',' + (i.qty - 1) + ')" class="grid h-6 w-6 place-items-center rounded-full hover:bg-[var(--chip)]">−</button>'
            + '</div>'
            + '<span class="text-sm font-extrabold">' + window.escapeHtml(fmt(i.price * i.qty)) + '</span>'
            + '</div></div><button onclick="Cart.remove(\'' + Cart.key(i) + '\')" aria-label="حذف" class="self-start text-neutral-600 hover:text-red-400">'+(window.CART_DRAWER_ICONS||{}).trash+'</button></div>';
        }).join('');
      }
      var tot = document.getElementById('cart-drawer-total');
      if (tot) tot.textContent = fmt(this.total());
      var foot = document.getElementById('cart-drawer-footer');
      if (foot) foot.classList.toggle('hidden', !this.items.length);
    }
  };
  window.Cart = Cart;

  var Wish = {
    ids: (Array.isArray(readStore('istore-wishlist'))?readStore('istore-wishlist'):[]).filter(function(id){return Number.isSafeInteger(id)&&id>0;}),
    save: function () { writeStore('istore-wishlist', this.ids); this.renderBadge(); },
    has: function (id) { return this.ids.indexOf(id) !== -1; },
    toggle: function (p) {
      if (this.has(p.id)) this.ids = this.ids.filter(function (i) { return i !== p.id; });
      else this.ids.push(p.id);
      this.save();
      document.querySelectorAll('[data-wish-btn="' + p.id + '"]').forEach((el) => {
        el.classList.toggle('text-red-500', this.has(p.id));
        el.classList.toggle('fill-current', this.has(p.id));
      });
      if (typeof window.renderWishlistPage === 'function') window.renderWishlistPage();
    },
    renderBadge: function () {
      var c = this.ids.length;
      document.querySelectorAll('[data-wish-count]').forEach(function (el) {
        el.textContent = c;
        el.classList.toggle('hidden', c === 0);
      });
    }
  };
  window.Wish = Wish;

  window.fmtPrice = function (v) {
    var cur = window.CURRENCY || 'د.ل';
    var f = window.PRICEFMT || {};
    var d = f.dec === '0' ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
      : f.dec === '2' ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { maximumFractionDigits: v % 1 === 0 ? 0 : 2 };
    var n; try { n = new Intl.NumberFormat('ar-LY', d).format(v); } catch (e) { n = String(v); }
    return f.pos === 'before' ? cur + ' ' + n : n + ' ' + cur;
  };

  // ---------- ظهور العناصر عند التمرير ----------
  function initReveal() {
    var els = document.querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  // ---------- ميلان بطاقات المنتجات ----------
  function initTilt() {
    document.querySelectorAll('.tilt').forEach(function (el) {
      if (el.dataset.tiltInit) return;
      el.dataset.tiltInit = '1';
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        var rx = (y / r.height - 0.5) * -9, ry = (x / r.width - 0.5) * 9;
        el.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  // ---------- الهيدر عند التمرير ----------
  function initHeader() {
    var h = document.getElementById('site-header');
    if (!h) return;
    var onScroll = function () {
      var sc = window.scrollY > 24;
      h.classList.toggle('glass', sc);
      h.classList.toggle('shadow-lg', sc);
      h.classList.toggle('shadow-black/30', sc);
      h.classList.toggle('border-b', sc);
      h.classList.toggle('border-[var(--border)]', sc);
      h.classList.toggle('bg-transparent', !sc);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---------- القائمة الجانبية للجوال ----------
  window.toggleMenu = function (open) {
    var ov = document.getElementById('mobile-menu');
    if (ov) { ov.classList.toggle('open', open); document.body.style.overflow = open ? 'hidden' : ''; }
  };

  // ---------- نافذة البحث ----------
  var searchTimer,searchController,searchSeq=0,searchFocus;
  function clearSearch(){clearTimeout(searchTimer);searchSeq++;if(searchController)searchController.abort();var r=document.getElementById('live-search-results');if(r){r.replaceChildren();r.setAttribute('aria-busy','false');}}
  window.toggleSearch = function (open) {
    var ov=document.getElementById('search-overlay');if(!ov)return;
    ov.classList.toggle('open',open);document.body.style.overflow=open?'hidden':'';
    if(open){searchFocus=document.activeElement;var inp=ov.querySelector('input');if(inp)setTimeout(function(){inp.focus();},60);}else{clearSearch();ov.querySelector('input').value='';if(searchFocus)searchFocus.focus();}
  };
  function initLiveSearch(){var input=document.getElementById('live-search-input'),results=document.getElementById('live-search-results'),form=document.getElementById('live-search-form');if(!input||!results)return;
    function message(text){results.replaceChildren();var el=document.createElement('p');el.className='live-search-message';el.textContent=text;results.append(el);}
    input.addEventListener('input',function(e){clearSearch();if(e.isComposing)return;var q=input.value.trim();if(!q)return;var seq=searchSeq;searchTimer=setTimeout(async function(){searchController=new AbortController();results.setAttribute('aria-busy','true');message('جاري البحث…');try{var response=await fetch(window.BASE+'/api/search.php?q='+encodeURIComponent(q),{signal:searchController.signal});if(!response.ok)throw Error('search');var data=await response.json();if(seq!==searchSeq)return;results.replaceChildren();var hits=Array.isArray(data.results)?data.results:[];if(!hits.length){message('لا نتائج مطابقة لـ «'+q+'»');return;}hits.slice(0,8).forEach(function(h){if(!h||typeof h.slug!=='string')return;var row=document.createElement('a');row.className='live-search-hit';row.href=window.BASE+'/product.php?slug='+encodeURIComponent(h.slug);var img=document.createElement('img'),url=String(h.image||'');try{var parsed=new URL(url,location.href);if(['http:','https:'].includes(parsed.protocol))img.src=parsed.href;}catch{}img.alt='';var name=document.createElement('span');name.className='live-search-name';name.textContent=String(h.name||'');var price=document.createElement('span');price.className='live-search-price';price.textContent=window.fmtPrice(Number(h.price)||0);row.append(img,name,price);results.append(row);});}catch(err){if(err.name!=='AbortError'&&seq===searchSeq)message('تعذر البحث الآن. اضغط Enter لفتح صفحة المنتجات.');}finally{if(seq===searchSeq)results.setAttribute('aria-busy','false');}},250);});
    input.addEventListener('compositionend',function(){input.dispatchEvent(new Event('input'));});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.getElementById('search-overlay').classList.contains('open'))toggleSearch(false);});
  }

  // ---------- سلايدر الهيرو ----------
  // Hero motion is loaded as a dedicated module on the home page.
  // ---------- زر العودة للأعلى ----------
  function initBackToTop() {
    var b = document.getElementById('back-to-top');
    if (!b) return;
    window.addEventListener('scroll', function () { b.classList.toggle('show', window.scrollY > 600); }, { passive: true });
    b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLiveSearch(); initReveal(); initTilt(); initHeader(); initBackToTop();
    Cart.renderBadge(); Cart.renderDrawer();
    Wish.renderBadge();

  });
})();

// استدعاء مُهيئات الصفحات بعد تحميل المتاجر المشتركة
if (typeof window.renderCartPage === 'function') window.renderCartPage();
if (typeof window.renderWishlistPage === 'function') window.renderWishlistPage();
if (typeof window.initCheckoutPage === 'function') window.initCheckoutPage();

// القسم الافتتاحي: تنعيم مبني على الزمن (lerp) مع منحنى smoothstep، transform/opacity فقط، ويحترم تقليل الحركة
(function () {
  var el = document.getElementById('intro');
  if (!el) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var content = el.querySelector('.intro-content'), logo = el.querySelector('.intro-logo'), cue = document.getElementById('intro-cue');
  var op = (parseFloat(el.getAttribute('data-opacity')) || 0) / 100, raf = 0, cur = 0, last = 0;
  function sm(x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }
  function target() { return Math.min(1, Math.max(0, window.scrollY / ((el.offsetHeight || 1) * 0.9))); }
  function paint(p) {
    var f = sm(p);
    if (content) { content.style.opacity = 1 - sm(p * 1.05); content.style.transform = reduce ? '' : 'translate3d(0,' + (-f * 36) + 'px,0) scale(' + (1 - f * 0.035) + ')'; }
    if (logo) { logo.style.opacity = op * (1 - f); logo.style.transform = reduce ? '' : 'translate3d(0,' + (f * 70) + 'px,0) scale(' + (1 + f * 0.25) + ')'; }
    if (cue) cue.style.opacity = 1 - sm(p * 3);
  }
  function tick(now) {
    var dt = last ? Math.min(64, now - last) : 16; last = now;
    var t = target();
    cur += (t - cur) * (1 - Math.exp(-dt / 150));
    if (Math.abs(t - cur) < 0.0008) cur = t;
    paint(cur);
    if (cur !== t) raf = requestAnimationFrame(tick); else { raf = 0; last = 0; }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  cur = target(); paint(cur);
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);
  if (cue) cue.addEventListener('click', function () { scrollTo({ top: el.offsetTop + el.offsetHeight - 70, behavior: reduce ? 'auto' : 'smooth' }); });
})();
