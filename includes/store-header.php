<?php
require_once APP_ROOT . '/includes/icons.php';
$s = settings();
$cats = categories();
$title = $page_title ?? ($s['store_name'] ?? 'آي ستور');
$desc = $page_desc ?? ($s['store_tagline'] ?? '');
$customer = customer_user();
?><!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($title) ?></title>
<meta name="description" content="<?= e($desc) ?>">
<script>
// تطبيق الثيم قبل الرسم لتفادي الوميض
try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.classList.toggle('light',t==='light')}catch(e){}
</script>
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = { future: { hoverOnlyWhenSupported: true }, corePlugins: { preflight: true }, theme: { extend: {} } };
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="<?= e(url('assets/css/app.css')) ?>">
<style>body{font-family:'Cairo',ui-sans-serif,system-ui,sans-serif}</style>
<script>window.BASE=<?= json_encode(BASE_URL) ?>;window.CURRENCY=<?= json_encode($s['currency'] ?? 'د.ل') ?>;</script>
</head>
<body class="page-in min-h-screen">

<?php require_once APP_ROOT . '/includes/announcement.php'; announce_render(); ?>

<header id="site-header" class="sticky top-0 z-40 bg-transparent">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="flex h-16 items-center justify-between gap-4">
      <a href="<?= e(url('index.php')) ?>" class="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white sm:text-xl">
        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--text)] text-[var(--bg)]"><?= icon('store', 20) ?></span>
        <span class="max-[360px]:hidden"><?= e($s['store_name'] ?? 'آي ستور') ?></span>
      </a>
      <nav class="hidden items-center gap-6 text-sm font-medium text-[var(--text-dim)] lg:flex">
        <a href="<?= e(url('products.php')) ?>" class="transition-colors hover:text-[var(--text)]">كل المنتجات</a>
        <a href="<?= e(url('brands.php')) ?>" class="transition-colors hover:text-[var(--text)]">الماركات</a>
        <?php foreach (array_slice($cats, 0, 5) as $c): ?>
        <a href="<?= e(url('products.php?category=' . $c['slug'])) ?>" class="transition-colors hover:text-[var(--text)]"><?= e($c['name']) ?></a>
        <?php endforeach; ?>
      </nav>
      <div class="flex items-center gap-1">
        <button onclick="toggleTheme()" aria-label="تبديل المظهر" class="hidden h-10 w-10 place-items-center rounded-full text-[var(--text)] transition-colors hover:bg-[var(--chip)] sm:grid"><span data-theme-icon>☀️</span></button>
        <button onclick="toggleSearch(true)" aria-label="بحث" class="grid h-10 w-10 place-items-center rounded-full text-[var(--text)] transition-colors hover:bg-[var(--chip)]"><?= icon('search') ?></button>
        <a href="<?= e(url('wishlist.php')) ?>" aria-label="المفضلة" class="relative grid h-10 w-10 place-items-center rounded-full text-[var(--text)] transition-colors hover:bg-[var(--chip)]">
          <?= icon('heart') ?>
          <span data-wish-count class="absolute -left-0.5 -top-0.5 hidden grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">0</span>
        </a>
        <a href="<?= e(url('account.php')) ?>" aria-label="حسابي" class="grid h-10 w-10 place-items-center rounded-full text-[var(--text)] transition-colors hover:bg-[var(--chip)]"><?= icon('user') ?></a>
        <button onclick="Cart.openDrawer()" aria-label="السلة" class="relative grid h-10 w-10 place-items-center rounded-full text-[var(--text)] transition-colors hover:bg-[var(--chip)]">
          <?= icon('shopping-bag') ?>
          <span data-cart-count class="absolute -left-0.5 -top-0.5 hidden grid h-5 min-w-5 place-items-center rounded-full bg-[var(--accent)] px-1 text-[11px] font-bold text-white">0</span>
        </button>
        <button onclick="toggleMenu(true)" aria-label="القائمة" class="grid h-10 w-10 place-items-center rounded-full text-[var(--text)] transition-colors hover:bg-[var(--chip)] lg:hidden"><?= icon('menu') ?></button>
      </div>
    </div>
  </div>
</header>

<!-- قائمة الجوال -->
<div id="mobile-menu" class="menu-overlay drawer-overlay fixed inset-0 z-50 bg-black/40" onclick="if(event.target===this)toggleMenu(false)">
  <div class="menu-panel absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-[var(--surface)] p-6 shadow-2xl backdrop-blur-xl">
    <div class="mb-8 flex items-center justify-between">
      <span class="text-lg font-extrabold text-white"><?= e($s['store_name'] ?? 'آي ستور') ?></span>
      <button onclick="toggleMenu(false)" aria-label="إغلاق" class="grid h-9 w-9 place-items-center rounded-full text-[var(--text-dim)] hover:bg-[var(--chip)]"><?= icon('x', 18) ?></button>
    </div>
    <nav class="flex flex-col gap-1 text-base font-medium">
      <a href="<?= e(url('index.php')) ?>" onclick="toggleMenu(false)" class="rounded-lg px-3 py-2.5 text-[var(--text)] hover:bg-[var(--chip)]">الرئيسية</a>
      <a href="<?= e(url('products.php')) ?>" onclick="toggleMenu(false)" class="rounded-lg px-3 py-2.5 text-[var(--text)] hover:bg-[var(--chip)]">كل المنتجات</a>
      <a href="<?= e(url('brands.php')) ?>" onclick="toggleMenu(false)" class="rounded-lg px-3 py-2.5 text-[var(--text)] hover:bg-[var(--chip)]">الماركات</a>
      <a href="<?= e(url('account.php')) ?>" onclick="toggleMenu(false)" class="rounded-lg px-3 py-2.5 text-[var(--text)] hover:bg-[var(--chip)]">حسابي</a>
      <div class="my-2 border-t border-[var(--border)]"></div>
      <?php foreach ($cats as $c): ?>
      <a href="<?= e(url('products.php?category=' . $c['slug'])) ?>" onclick="toggleMenu(false)" class="rounded-lg px-3 py-2.5 text-[var(--text-dim)] hover:bg-[var(--chip)]"><?= e($c['name']) ?></a>
      <?php endforeach; ?>
      <div class="my-2 border-t border-[var(--border)]"></div>
      <a href="<?= e(url('track.php')) ?>" onclick="toggleMenu(false)" class="rounded-lg px-3 py-2.5 text-[var(--text-dim)] hover:bg-[var(--chip)]">تتبع طلبك</a>
      <div class="mt-2 flex items-center justify-between rounded-lg px-3 py-2.5 text-[var(--text-dim)]">
        <span>المظهر</span>
        <button onclick="toggleTheme()" aria-label="تبديل المظهر" class="grid h-9 w-9 place-items-center rounded-full text-[var(--text)] transition-colors hover:bg-[var(--chip)]"><span data-theme-icon>☀️</span></button>
      </div>
    </nav>
  </div>
</div>

<!-- سلة التسوق الجانبية -->
<div id="cart-drawer" class="drawer-overlay fixed inset-0 z-50 bg-black/40" onclick="if(event.target===this)Cart.closeDrawer()">
  <div class="drawer-panel absolute inset-y-0 left-0 flex w-96 max-w-[92vw] flex-col bg-[var(--surface)] shadow-2xl backdrop-blur-xl">
    <div class="flex items-center justify-between border-b border-[var(--border)] p-5">
      <span class="text-lg font-extrabold text-white">سلة التسوق</span>
      <button onclick="Cart.closeDrawer()" aria-label="إغلاق" class="grid h-9 w-9 place-items-center rounded-full text-[var(--text-dim)] hover:bg-[var(--chip)]"><?= icon('x', 18) ?></button>
    </div>
    <div id="cart-drawer-items" class="flex-1 space-y-3 overflow-y-auto p-4"></div>
    <div id="cart-drawer-footer" class="hidden border-t border-[var(--border)] p-5">
      <div class="mb-4 flex items-center justify-between text-base font-extrabold">
        <span>الإجمالي</span>
        <span id="cart-drawer-total">0</span>
      </div>
      <a href="<?= e(url('checkout.php')) ?>" class="glow-btn block rounded-full py-3.5 text-center font-bold transition hover:scale-[1.02]">إتمام الطلب</a>
      <a href="<?= e(url('cart.php')) ?>" class="mt-2 block rounded-full border border-[var(--border)] py-3 text-center text-sm font-bold text-[var(--text-dim)] transition hover:bg-[var(--chip)]">عرض السلة</a>
    </div>
  </div>
</div>

<!-- نافذة البحث -->
<div id="search-overlay" class="search-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onclick="if(event.target===this)toggleSearch(false)">
  <div class="search-box mx-auto mt-24 max-w-xl px-4">
    <form action="<?= e(url('products.php')) ?>" method="get" class="flex overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl backdrop-blur-xl">
      <input name="q" type="search" placeholder="ابحث عن منتج..." class="w-full bg-transparent px-5 py-4 text-lg text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]">
      <button class="glow-btn px-6 font-bold">بحث</button>
    </form>
  </div>
</div>
