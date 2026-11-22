<?php
require __DIR__ . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';
$brands = qall('SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.active = 1) AS products_count FROM brands b WHERE b.active = 1 ORDER BY b.sort_order, b.name');
$page_title = 'الماركات';
require APP_ROOT . '/includes/store-header.php';
?>
<div class="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
  <h1 class="text-3xl font-black sm:text-4xl">الماركات</h1>
  <p class="mt-2 text-[var(--text-faint)]">تسوّق حسب ماركتك المفضلة — كلها منتجات أصلية ومضمونة</p>
  <?php if (!$brands): ?>
    <div class="mt-8 grid place-items-center rounded-3xl bg-[var(--card)] py-24 text-center">
      <p class="text-lg font-bold text-[var(--text-dim)]">لا توجد ماركات بعد</p>
    </div>
  <?php else: ?>
    <div class="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      <?php foreach ($brands as $i => $b): ?>
        <a href="<?= url('products.php?brand=' . rawurlencode($b['slug'])) ?>" class="reveal group flex flex-col items-center gap-4 rounded-3xl bg-[var(--card)] p-8 text-center transition hover:bg-[var(--chip)]" style="transition-delay: <?= ($i % 8) * 60 ?>ms">
          <?php if ($b['image']): ?>
            <img src="<?= e(img_url($b['image'])) ?>" alt="<?= e($b['name']) ?>" class="h-20 w-20 rounded-3xl bg-[var(--chip)] object-cover transition group-hover:scale-105">
          <?php else: ?>
            <span class="grid h-20 w-20 place-items-center rounded-3xl bg-[var(--chip)] text-[var(--text-dim)] transition group-hover:scale-105"><?= icon('tag', 30) ?></span>
          <?php endif; ?>
          <span>
            <span class="block text-lg font-extrabold"><?= e($b['name']) ?></span>
            <span class="mt-1 block text-sm text-[var(--text-faint)]"><?= (int)$b['products_count'] ?> منتج</span>
          </span>
        </a>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>
<?php require APP_ROOT . '/includes/store-footer.php'; ?>
