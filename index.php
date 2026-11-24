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
<link rel="stylesheet" href="<?= e(url('assets/css/hero-slider.css')) ?>?v=3">
<section id="hero-slider" class="hero-rail on-dark" aria-roledescription="عرض شرائح" aria-label="عروض المتجر">
  <div class="hp-clip">
    <div class="hp-track" aria-hidden="true">
      <?php $cards = count($slides) > 1 ? array_merge([end($slides)], $slides, [$slides[0]]) : $slides; foreach ($cards as $sl): ?>
      <article class="hp-card"><img src="<?= e(img_url($sl['image'])) ?>" alt="" draggable="false"></article>
      <?php endforeach; ?>
    </div>
    <div class="hp-overlay">
      <?php foreach ($slides as $i => $sl): $href = str_starts_with($sl['cta_link'], 'http') ? $sl['cta_link'] : url(ltrim($sl['cta_link'], '/')); ?>
      <div class="hp-copy" data-copy="<?= $i ?>" data-label="<?= e($sl['cta_text']) ?>" data-href="<?= e($href) ?>" aria-hidden="<?= $i === 0 ? 'false' : 'true' ?>">
        <<?= $heroTag ?>><?= e($sl['title']) ?></<?= $heroTag ?>><p><?= e($sl['subtitle']) ?></p><div class="hp-cta-space" aria-hidden="true">&nbsp;</div>
      </div>
      <?php endforeach; $firstHref = str_starts_with($slides[0]['cta_link'], 'http') ? $slides[0]['cta_link'] : url(ltrim($slides[0]['cta_link'], '/')); ?>
      <div class="hp-copy hp-fixed-button"><a href="<?= e($firstHref) ?>"><?= e($slides[0]['cta_text']) ?></a></div>
    </div>
    <?php if (count($slides) > 1): ?>
    <button type="button" data-go="-1" class="hp-arrow prev" aria-label="السابق">‹</button><button type="button" data-go="1" class="hp-arrow next" aria-label="التالي">›</button>
    <?php endif; ?>
  </div>
  <?php if (count($slides) > 1): ?><div class="hp-dots"><?php foreach ($slides as $i => $sl): ?><button type="button" data-dot="<?= $i ?>" class="<?= $i === 0 ? 'active' : '' ?>" aria-label="شريحة <?= $i + 1 ?>"></button><?php endforeach; ?></div><?php endif; ?>
</section>
<script type="module" src="<?= e(url('assets/js/hero-motion.js')) ?>?v=6"></script>
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
      <?php if (!empty($b['image'])): ?>
      <img src="<?= e(img_url($b['image'])) ?>" alt="<?= e($b['title']) ?>" loading="lazy" class="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-white/20">
      <?php else: ?>
      <span class="shrink-0 text-white/80"><?= icon('tag', 36) ?></span>
      <?php endif; ?>
      <div>
        <h3 class="text-xl font-extrabold text-white"><?= e($b['title']) ?></h3>
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
