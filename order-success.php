<?php
require __DIR__ . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';
$code = trim($_GET['code'] ?? '');
$order = $code ? qone('SELECT * FROM orders WHERE code = ?', [$code]) : null;
$page_title = 'تم استلام طلبك';
require APP_ROOT . '/includes/store-header.php';
$wa = preg_replace('/\D+/', '', setting('whatsapp', ''));
?>
<div class="mx-auto max-w-3xl px-4 pt-14 text-center sm:px-6">
  <div class="reveal mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
    <?= icon('check', 40) ?>
  </div>
  <h1 class="mt-6 text-3xl font-black sm:text-4xl">شكراً لك! تم استلام طلبك</h1>
  <p class="mt-3 text-[var(--text-dim)]">سنتواصل معك قريباً لتأكيد الطلب وموعد التوصيل. الدفع عند الاستلام.</p>
  <?php if ($order): ?>
    <div class="mt-8 inline-flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-4">
      <span class="text-sm text-[var(--text-dim)]">رقم الطلب:</span>
      <b class="text-xl tracking-wide text-[var(--accent)]" dir="ltr"><?= e($order['code']) ?></b>
    </div>
    <p class="mt-4 text-sm text-[var(--text-dim)]">احتفظ برقم الطلب لتتبع حالته في أي وقت.</p>
    <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
      <a href="<?= url('track.php?code=' . rawurlencode($order['code'])) ?>" class="rounded-full bg-[var(--chip)] px-6 py-3 text-sm font-bold transition hover:bg-[var(--chip-hover)]">تتبع الطلب</a>
      <?php if ($wa): ?>
        <a href="https://wa.me/<?= e($wa) ?>?text=<?= rawurlencode('مرحباً، استفسار عن الطلب ' . $order['code']) ?>" target="_blank" rel="noopener" class="rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-400">تواصل عبر واتساب</a>
      <?php endif; ?>
      <a href="<?= url('products.php') ?>" class="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-bold transition hover:bg-[var(--chip)]">متابعة التسوق</a>
    </div>
  <?php endif; ?>
</div>
<?php require APP_ROOT . '/includes/store-footer.php'; ?>
