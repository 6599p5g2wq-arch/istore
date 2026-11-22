<?php
require __DIR__ . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';
$page_title = 'من نحن';
require APP_ROOT . '/includes/store-header.php';
?>
<div class="mx-auto max-w-3xl px-4 pt-16 sm:px-6">
  <div class="reveal">
    <h1 class="text-3xl font-black sm:text-4xl">من نحن</h1>
    <p class="mt-6 whitespace-pre-line text-lg leading-9 text-[var(--text-dim)]"><?= e(setting('about_text', '')) ?></p>
  </div>
  <div class="reveal mt-12 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8">
    <h2 class="flex items-center gap-2 text-xl font-extrabold"><?= icon('truck', 20, 'text-[var(--accent)]') ?> سياسة التوصيل</h2>
    <p class="mt-3 whitespace-pre-line leading-8 text-[var(--text-dim)]"><?= e(setting('delivery_policy', '')) ?></p>
  </div>
  <div class="reveal mt-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8">
    <h2 class="flex items-center gap-2 text-xl font-extrabold"><?= icon('rotate-ccw', 20, 'text-[var(--accent)]') ?> سياسة الاستبدال والاسترجاع</h2>
    <p class="mt-3 whitespace-pre-line leading-8 text-[var(--text-dim)]"><?= e(setting('returns_policy', '')) ?></p>
  </div>
  <div class="reveal mt-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8">
    <h2 class="flex items-center gap-2 text-xl font-extrabold"><?= icon('store', 20, 'text-[var(--accent)]') ?> معلومات التواصل</h2>
    <p class="mt-3 leading-8 text-[var(--text-dim)]"><?= e(setting('address', '')) ?> — <span dir="ltr"><?= e(setting('phone', '')) ?></span> — <?= e(setting('email', '')) ?></p>
    <p class="text-[var(--text-dim)]"><?= e(setting('working_hours', '')) ?></p>
  </div>
</div>
<?php require APP_ROOT . '/includes/store-footer.php'; ?>
