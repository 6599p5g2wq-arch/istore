<?php
require __DIR__ . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';

function normalize_phone(string $p): string {
    $p = preg_replace('/[^\d+]/', '', $p);
    return preg_replace('/^\+?218/', '0', $p);
}

$code = strtoupper(trim($_GET['code'] ?? ''));
$phone = trim($_GET['phone'] ?? '');
$order = null; $items = []; $error = '';
if ($code !== '' && $phone !== '') {
    $order = qone('SELECT * FROM orders WHERE UPPER(code) = ?', [$code]);
    if (!$order || normalize_phone($order['phone']) !== normalize_phone($phone)) {
        $order = null;
        $error = 'لم يتم العثور على طلب بهذه البيانات';
    } else {
        $items = qall('SELECT name, qty, variant_label FROM order_items WHERE order_id = ?', [$order['id']]);
    }
}
$statuses = ['new' => 'قيد المراجعة', 'confirmed' => 'تم التأكيد', 'shipped' => 'في الطريق إليك', 'delivered' => 'تم التوصيل'];
$page_title = 'تتبع طلبك';
require APP_ROOT . '/includes/store-header.php';
?>
<div class="mx-auto max-w-2xl px-4 pt-14 sm:px-6">
  <h1 class="text-center text-3xl font-black sm:text-4xl">تتبع طلبك</h1>
  <p class="mt-3 text-center text-[var(--text-faint)]">أدخل رقم الطلب ورقم هاتفك لمعرفة حالة طلبك</p>

  <form method="get" action="<?= url('track.php') ?>" class="mt-8 space-y-4 rounded-3xl border border-[var(--border)] bg-[var(--card)] glass-card p-6">
    <label class="block text-sm font-bold">رقم الطلب
      <input name="code" required dir="ltr" value="<?= e($code) ?>" placeholder="IST-XXXXXX" class="mt-1.5 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-left outline-none transition placeholder:text-[var(--text-dim)] placeholder:opacity-90 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20">
    </label>
    <label class="block text-sm font-bold">رقم الهاتف
      <input name="phone" required dir="ltr" inputmode="tel" value="<?= e($phone) ?>" placeholder="09XXXXXXXX" class="mt-1.5 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-left outline-none transition placeholder:text-[var(--text-dim)] placeholder:opacity-90 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20">
    </label>
    <button class="glow-btn w-full rounded-full py-3.5 font-bold transition hover:scale-[1.01]">تتبع</button>
  </form>

  <?php if ($error): ?>
    <p class="mt-4 rounded-2xl bg-red-500/10 p-4 text-center text-sm font-bold text-red-400"><?= e($error) ?></p>
  <?php endif; ?>

  <?php if ($order): ?>
    <div class="reveal mt-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] glass-card p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-sm text-[var(--text-faint)]">طلب <b dir="ltr"><?= e($order['code']) ?></b> — <?= e($order['city']) ?></p>
          <p class="text-sm text-[var(--text-faint)]"><?= e(format_date($order['created_at'])) ?></p>
        </div>
        <span class="rounded-full px-4 py-1.5 text-sm font-bold <?= order_status_class($order['status']) ?>"><?= e(order_status_label($order['status'])) ?></span>
      </div>
      <?php if ($order['status'] !== 'cancelled'): ?>
        <div class="mt-8 flex items-center">
          <?php $keys = array_keys($statuses); $cur = array_search($order['status'], $keys, true); if ($cur === false) $cur = 0; ?>
          <?php foreach ($statuses as $i => $label): ?>
            <div class="flex flex-1 flex-col items-center gap-2 text-center">
              <span class="grid h-9 w-9 place-items-center rounded-full border-2 <?= $i <= $cur ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--text-faint)]' ?>">
                <?= $i < $cur ? icon('check', 16) : '<b class="text-xs">' . ($i + 1) . '</b>' ?>
              </span>
              <span class="text-xs font-bold <?= $i <= $cur ? 'text-[var(--text)]' : 'text-[var(--text-faint)]' ?>"><?= e($label) ?></span>
            </div>
            <?php if ($i < count($statuses) - 1): ?><div class="h-0.5 flex-1 -translate-y-3.5 rounded <?= $i < $cur ? 'bg-[var(--accent)]' : 'bg-[var(--border)]' ?>"></div><?php endif; ?>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
      <div class="mt-8 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
        <?php foreach ($items as $it): ?>
          <div class="flex justify-between"><span><?= e($it['name']) ?><?php if (!empty($it['variant_label'])): ?> · <span class="text-[var(--text-faint)]"><?= e($it['variant_label']) ?></span><?php endif; ?> <span class="text-[var(--text-faint)]">× <?= (int)$it['qty'] ?></span></span></div>
        <?php endforeach; ?>
        <div class="flex justify-between border-t border-[var(--border)] pt-3 text-lg font-extrabold"><span>الإجمالي</span><span class="text-[var(--accent)]"><?= e(format_price((float)$order['total'])) ?></span></div>
      </div>
    </div>
  <?php endif; ?>
</div>
<?php require APP_ROOT . '/includes/store-footer.php'; ?>
