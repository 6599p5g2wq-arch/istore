/* آي ستور — منطق الواجهة (بدون أي مكتبات خارجية) */
(function () {
  'use strict';

  // ---------- الثيم (ليلي/نهاري) ----------
  window.applyTheme = function (t) {
    document.documentElement.classList.toggle('light', t === 'light');
    try { localStorage.setItem('theme', t); } catch (e) {}
    document.querySelectorAll('[data-theme-icon]').forEach(function (el) {
      el.textContent = t === 'light' ? '🌙' : '☀️';
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

  var Cart = {
    items: readStore('istore-cart'),
    save: function () { writeStore('istore-cart', this.items); this.renderBadge(); },
    key: function (i) { return i.id + ':' + (i.variant_id || 0); },
    add: function (p, qty) {
      qty = qty || 1;
      var k = this.key(p);
      var found = null;
      this.items.forEach(function (i) { if (Cart.key(i) === k) found = i; });
      if (found) found.qty = Math.min(found.qty + qty, p.stock || 99);
      else this.items.push({ id: p.id, name: p.name, price: p.price, image: p.image, slug: p.slug, stock: p.stock, variant_id: p.variant_id || 0, variant_label: p.variant_label || '', qty: qty });
      this.save();
      this.openDrawer();
    },
    setQty: function (key, qty) {
      this.items.forEach(function (i) {
        if (Cart.key(i) === key) i.qty = Math.max(1, Math.min(qty, i.stock || 99));
      });
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
        box.innerHTML = '<div class="py-16 text-center text-[var(--text-faint)]">سلتك فارغة — أضف منتجات تعجبك</div>';
      } else {
        box.innerHTML = this.items.map(function (i) {
          return '<div class="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">'
            + '<a href="' + window.BASE + '/product.php?slug=' + encodeURIComponent(i.slug) + '" class="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-2)]"><img src="' + i.image + '" alt="" class="h-full w-full object-cover"></a>'
            + '<div class="flex flex-1 flex-col">'
            + '<div class="flex items-start justify-between gap-2"><p class="line-clamp-2 text-sm font-bold">' + i.name + (i.variant_label ? ' <span class="text-xs font-bold text-[var(--text-faint)]">' + i.variant_label + '</span>' : '') + '</p>'
            + '<button onclick="Cart.remove(\'' + Cart.key(i) + '\')" aria-label="حذف" class="text-[var(--text-faint)] hover:text-red-400">✕</button></div>'
            + '<div class="mt-auto flex items-center justify-between pt-2">'
            + '<div class="flex items-center gap-2 rounded-full border border-[var(--border)] px-2 py-1">'
            + '<button onclick="Cart.setQty(\'' + Cart.key(i) + '\',' + (i.qty + 1) + ')" class="grid h-6 w-6 place-items-center rounded-full hover:bg-[var(--chip)]">+</button>'
            + '<span class="min-w-6 text-center text-sm font-bold">' + i.qty + '</span>'
            + '<button onclick="Cart.setQty(\'' + Cart.key(i) + '\',' + (i.qty - 1) + ')" class="grid h-6 w-6 place-items-center rounded-full hover:bg-[var(--chip)]">−</button>'
            + '</div>'
            + '<span class="text-sm font-extrabold">' + fmt(i.price * i.qty) + '</span>'
            + '</div></div></div>';
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
    ids: readStore('istore-wishlist'),
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
    var n = (Math.floor(v) === v) ? String(v) : v.toFixed(2);
    n = n.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return n + ' ' + cur;
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
  window.toggleSearch = function (open) {
    var ov = document.getElementById('search-overlay');
    if (ov) {
      ov.classList.toggle('open', open);
      if (open) { var inp = ov.querySelector('input'); if (inp) setTimeout(function () { inp.focus(); }, 60); }
    }
  };

  // ---------- سلايدر الهيرو ----------
  function initHero() {
    var root = document.getElementById('hero-slider');
    if (!root) return;
    var slides = root.querySelectorAll('.hero-slide');
    if (slides.length < 2) { if (slides[0]) slides[0].classList.add('active'); return; }
    var idx = 0;
    var show = function (i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('active', k === idx); });
      root.querySelectorAll('[data-dot]').forEach(function (d, k) {
        d.className = 'h-2 rounded-full transition-all duration-300 ' + (k === idx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60');
      });
    };
    window.heroGo = function (d) { show(idx + d); };
    window.heroShow = show;
    show(0);
    setInterval(function () { show(idx + 1); }, 6000);
  }

  // ---------- زر العودة للأعلى ----------
  function initBackToTop() {
    var b = document.getElementById('back-to-top');
    if (!b) return;
    window.addEventListener('scroll', function () { b.classList.toggle('show', window.scrollY > 600); }, { passive: true });
    b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  // ---------- إشعار زيارة الصفحة ----------
  function initAnalytics() {
    try {
      var fd = new FormData();
      fd.append('path', location.pathname + location.search);
      fd.append('referrer', document.referrer || '');
      navigator.sendBeacon(window.BASE + '/api/analytics.php', fd);
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    initReveal(); initTilt(); initHeader(); initHero(); initBackToTop();
    Cart.renderBadge(); Cart.renderDrawer();
    Wish.renderBadge();
    initAnalytics();
  });
})();

// استدعاء مُهيئات الصفحات بعد تحميل المتاجر المشتركة
if (typeof window.renderCartPage === 'function') window.renderCartPage();
if (typeof window.renderWishlistPage === 'function') window.renderWishlistPage();
if (typeof window.initCheckoutPage === 'function') window.initCheckoutPage();
