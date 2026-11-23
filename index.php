<?php
require __DIR__ . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';
require APP_ROOT . '/includes/product-card.php';
require APP_ROOT . '/includes/intro.php';
require APP_ROOT . '/includes/marquee.php';
$intro = intro_cfg();
$heroTag = $intro['enabled'] ? 'h2' : 'h1';

$slides = qall('SELECT * FROM hero_slides WHERE active = 1 ORDER BY sort_order');
$cats = categories();
$featured = qall('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.active = 1 AND p.featured = 1 ORDER BY p.created_at DESC LIMIT 8');
$newest = qall('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.active = 1 ORDER BY p.created_at DESC, p.id DESC LIMIT 8');
$offers = qall('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.active = 1 AND p.old_price IS NOT NULL AND p.old_price > p.price ORDER BY (p.old_price - p.price) DESC LIMIT 8');
$banners = qall('SELECT * FROM banners WHERE active = 1 ORDER BY sort_order LIMIT 3');
$threshold = (float)setting('free_shipping_threshold', '0');

require APP_ROOT . '/includes/store-header.php';
?>

<?php if ($intro['enabled']): $ilink = str_starts_with($intro['cta_link'], 'http') ? $intro['cta_link'] : url(ltrim($intro['cta_link'], '/')); ?>
<!-- القسم الافتتاحي -->
<section class="intro" id="intro" data-opacity="<?= e((string)$intro['opacity']) ?>">
  <?php if ($intro['logo'] !== ''): ?><div class="intro-logo" aria-hidden="true" style="background-image:url('<?= e(img_url($intro['logo'])) ?>');opacity:<?= e((string)($intro['opacity'] / 100)) ?>"></div><?php endif; ?>
  <div class="intro-content">
    <?php if ($intro['pill'] !== ''): ?><span class="intro-pill"><?= icon('sparkles', 14) ?> <?= e($intro['pill']) ?></span><?php endif; ?>
    <h1 class="intro-title"><?= e($intro['title']) ?></h1>
    <?php if ($intro['tagline'] !== ''): ?><p class="intro-tagline"><?= e($intro['tagline']) ?></p><?php endif; ?>
    <?php if ($intro['chips']): ?>
    <ul class="intro-chips">
      <?php foreach ($intro['chips'] as $i => $c): ?>
      <li class="intro-chip" style="animation-delay:<?= 0.25 + $i * 0.12 ?>s"><span class="text-[var(--accent)]"><?= icon($c['icon'], 18) ?></span><?= e($c['text']) ?></li>
      <?php endforeach; ?>
    </ul>
    <?php endif; ?>
    <?php if ($intro['cta_text'] !== ''): ?><a href="<?= e($ilink) ?>" class="intro-cta glow-btn"><?= e($intro['cta_text']) ?></a><?php endif; ?>
  </div>
  <button type="button" class="intro-cue" id="intro-cue" aria-label="انتقل للأسفل"><span class="intro-mouse"></span><span>اسحب للأسفل</span></button>
</section>
<?php endif; ?>

<!-- سلايدر الهيرو -->
<?php if ($slides): ?>
<section class="relative mx-auto max-w-7xl px-4 pt-6 sm:px-6">
  <div id="hero-slider" class="on-dark relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#140b30]/85 text-white shadow-[0_30px_90px_-20px_rgba(123,47,247,.45)] backdrop-blur-xl">
    <div class="pointer-events-none absolute -left-32 -top-32 h-[34rem] w-[34rem]" style="background:radial-gradient(closest-side,rgba(0,198,255,.28),transparent)"></div>
    <div class="pointer-events-none absolute -bottom-52 -right-32 h-[34rem] w-[34rem]" style="background:radial-gradient(closest-side,rgba(147,51,234,.3),transparent)"></div>
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
    <?php foreach ($slides as $i => $sl): ?>
    <div class="hero-slide <?= $i === 0 ? 'active' : '' ?> relative z-10 grid min-h-[540px] items-center gap-8 p-8 sm:p-14 lg:min-h-[640px] lg:grid-cols-2">
      <div class="relative z-10 order-2 lg:order-1">
        <span class="hst mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold backdrop-blur"><?= icon('sparkles', 14) ?> تشكيلة <?= date('Y') ?> الجديدة</span>
        <<?= $heroTag ?> class="hst text-balance whitespace-pre-line text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl lg:text-7xl"><?= e($sl['title']) ?></<?= $heroTag ?>>
        <p class="hst mt-5 max-w-md text-base leading-8 text-white/70 sm:text-lg"><?= e($sl['subtitle']) ?></p>
        <div class="hst mt-8 flex flex-wrap items-center gap-4">
          <a href="<?= e(str_starts_with($sl['cta_link'], 'http') ? $sl['cta_link'] : url(ltrim($sl['cta_link'], '/'))) ?>" class="glow-btn group inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-bold transition hover:scale-[1.03]">
            <?= e($sl['cta_text']) ?>
            <?= icon('chevron-left', 18, 'transition-transform group-hover:-translate-x-1') ?>
          </a>
        </div>
      </div>
      <div class="relative z-10 order-1 lg:order-2">
        <div class="relative mx-auto aspect-square w-full max-w-md rounded-[2rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)]">
          <div class="h-full w-full overflow-hidden rounded-[2rem]" style="-webkit-mask-image:-webkit-radial-gradient(white,black);transform:translateZ(0)">
          <img src="<?= e(img_url($sl['image'])) ?>" alt="<?= e($sl['title']) ?>" class="h-full w-full rounded-[2rem] object-cover">
          </div>
        </div>
      </div>
    </div>
    <?php endforeach; ?>
    <?php if (count($slides) > 1): ?>
    <div class="absolute bottom-6 right-8 z-20 flex gap-2 sm:right-14">
      <?php foreach ($slides as $i => $sl): ?>
      <button data-dot onclick="heroShow(<?= $i ?>)" aria-label="شريحة <?= $i + 1 ?>" class="h-2 rounded-full transition-all duration-300 <?= $i === 0 ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60' ?>"></button>
      <?php endforeach; ?>
    </div>
    <button onclick="heroGo(-1)" aria-label="السابق" class="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:grid"><?= icon('chevron-left') ?></button>
    <button onclick="heroGo(1)" aria-label="التالي" class="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:grid"><?= icon('chevron-right') ?></button>
    <?php endif; ?>
  </div>
</section>
<?php endif; ?>

<!-- شريط المميزات المتحرك -->
<?php $mq = marquee_cfg(); if ($mq['enabled']):
  // كل نصف أعرض من أوسع شاشة كي لا تظهر فراغات أثناء الحركة
  $reps = max(2, (int)ceil(12 / count($mq['items']))); ?>
<div class="mt-10 overflow-hidden border-y border-[var(--border)] bg-[var(--surface)] py-4" dir="ltr">
  <div class="animate-marquee flex w-max gap-12">
    <?php for ($h = 0; $h < 2; $h++): ?>
    <div class="flex gap-12">
      <?php for ($r = 0; $r < $reps; $r++) foreach ($mq['items'] as $m): ?>
      <span class="flex items-center gap-2.5 whitespace-nowrap text-sm font-bold text-[var(--text-dim)]" dir="rtl"><span class="text-[var(--accent)]"><?= icon($m['icon'], 18) ?></span><?= e($m['text']) ?></span>
      <?php endforeach; ?>
    </div>
    <?php endfor; ?>
  </div>
</div>
<?php endif; ?>

<!-- التصنيفات -->
<section class="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
  <div class="reveal mb-8 flex items-end justify-between">
    <div>
      <span class="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--accent)]"><?= icon('grid', 16) ?> تسوق حسب التصنيف</span>
      <h2 class="text-3xl font-black sm:text-4xl">تصنيفات المتجر</h2>
    </div>
    <a href="<?= e(url('products.php')) ?>" class="group hidden items-center gap-1 text-sm font-bold text-[var(--text-dim)] hover:text-[var(--text)] sm:flex">عرض الكل <?= icon('chevron-left', 16, 'transition-transform group-hover:-translate-x-1') ?></a>
  </div>
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7 lg:gap-3">
    <?php foreach ($cats as $i => $c): ?>
    <a href="<?= e(url('products.php?category=' . $c['slug'])) ?>" class="reveal group block overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] text-center transition hover:border-white/25 hover:shadow-[0_16px_40px_-12px_rgba(0,113,227,.35)]" style="transition-delay:<?= $i * 0.06 ?>s">
      <div class="aspect-square overflow-hidden"><img src="<?= e(img_url($c['image'])) ?>" alt="<?= e($c['name']) ?>" loading="lazy" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"></div>
      <p class="p-3 text-sm font-bold text-[var(--text)]"><?= e($c['name']) ?></p>
    </a>
    <?php endforeach; ?>
  </div>
</section>

<!-- منتجات مميزة -->
<?php if ($featured): ?>
<section class="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
  <div class="reveal mb-8 flex items-end justify-between">
    <div>
      <span class="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--accent)]"><?= icon('star', 16) ?> مختاراتنا لك</span>
      <h2 class="text-3xl font-black sm:text-4xl">منتجات مميزة</h2>
    </div>
    <a href="<?= e(url('products.php')) ?>" class="group hidden items-center gap-1 text-sm font-bold text-[var(--text-dim)] hover:text-[var(--text)] sm:flex">عرض الكل <?= icon('chevron-left', 16, 'transition-transform group-hover:-translate-x-1') ?></a>
  </div>
  <div class="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
    <?php foreach ($featured as $i => $p) echo product_card($p, $i); ?>
  </div>
</section>
<?php endif; ?>

<!-- بانرات ترويجية -->
<?php if ($banners): ?>
<section class="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
  <div class="grid gap-4 <?= count($banners) === 1 ? '' : (count($banners) === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3') ?>">
    <?php foreach ($banners as $i => $b): ?>
    <a href="<?= e(str_starts_with($b['link'], 'http') ? $b['link'] : url(ltrim($b['link'], '/'))) ?>" class="reveal group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-l from-neutral-900 to-neutral-800 p-7 text-white shadow-lg" style="transition-delay:<?= $i * 0.1 ?>s">
      <div class="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-[var(--accent)] opacity-25 blur-2xl transition group-hover:opacity-40"></div>
      <span class="shrink-0 text-white/80"><?= icon('tag', 36) ?></span>
      <div>
        <h3 class="text-xl font-extrabold"><?= e($b['title']) ?></h3>
        <p class="mt-1 text-sm text-white/70"><?= e($b['subtitle']) ?></p>
      </div>
    </a>
    <?php endforeach; ?>
  </div>
</section>
<?php endif; ?>

<!-- عروض -->
<?php if ($offers): ?>
<section class="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
  <div class="reveal mb-8 flex items-end justify-between">
    <div>
      <span class="mb-2 flex items-center gap-2 text-sm font-bold text-red-400"><?= icon('tag', 16) ?> وفر أكثر</span>
      <h2 class="text-3xl font-black sm:text-4xl">عروض وتخفيضات</h2>
    </div>
    <a href="<?= e(url('products.php?offers=1')) ?>" class="group hidden items-center gap-1 text-sm font-bold text-[var(--text-dim)] hover:text-[var(--text)] sm:flex">كل العروض <?= icon('chevron-left', 16, 'transition-transform group-hover:-translate-x-1') ?></a>
  </div>
  <div class="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
    <?php foreach (array_slice($offers, 0, 4) as $i => $p) echo product_card($p, $i); ?>
  </div>
</section>
<?php endif; ?>

<!-- أحدث المنتجات -->
<?php if ($newest): ?>
<section class="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
  <div class="reveal mb-8">
    <span class="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-400"><?= icon('star', 16) ?> وصل حديثاً</span>
    <h2 class="text-3xl font-black sm:text-4xl">أحدث المنتجات</h2>
  </div>
  <div class="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
    <?php foreach (array_slice($newest, 0, 4) as $i => $p) echo product_card($p, $i); ?>
  </div>
</section>
<?php endif; ?>

<!-- شحن مجاني -->
<?php if ($threshold > 0): ?>
<section class="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
  <div class="reveal relative overflow-hidden rounded-[2rem] bg-[var(--accent)] p-10 text-center text-white sm:p-16">
    <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--chip)] blur-2xl"></div>
    <div class="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-black/10 blur-2xl"></div>
    <h2 class="relative text-3xl font-black sm:text-4xl">شحن مجاني للطلبات فوق <?= e(format_price($threshold)) ?></h2>
    <p class="relative mx-auto mt-4 max-w-xl text-white/85">اطلب الآن واستفد من التوصيل المجاني السريع لأي مدينة في ليبيا — الدفع عند الاستلام.</p>
    <a href="<?= e(url('products.php')) ?>" class="relative mt-8 inline-block rounded-full bg-white px-10 py-4 font-bold text-black shadow-lg transition hover:scale-105">تسوق الآن</a>
  </div>
</section>
<?php endif; ?>

<?php require APP_ROOT . '/includes/store-footer.php'; ?>
