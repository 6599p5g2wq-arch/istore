<?php
require_once __DIR__ . '/_init.php';
require_admin();
$phone = trim($_GET['phone'] ?? '');
$orders = $phone ? qall('SELECT * FROM orders WHERE customer_id IS NULL AND phone = ? ORDER BY id DESC', [$phone]) : [];
if (!$orders) { flash('لا توجد طلبات لهذا الرقم', true); redirect_admin('customers.php?tab=guests'); }
$name = $orders[0]['customer_name'];
$valid = array_filter($orders, fn($o) => $o['status'] !== 'cancelled');
$spent = array_sum(array_map(fn($o) => (float)$o['total'], $valid));
$avg = count($valid) ? $spent / count($valid) : 0;
$addrs = [];
foreach ($orders as $o) {
    $k = trim($o['city'] . '||' . $o['address']);
    if (isset($addrs[$k])) $addrs[$k]['n']++;
    else $addrs[$k] = ['city' => $o['city'], 'address' => $o['address'], 'n' => 1, 'last' => $o['created_at']];
}
$STATUS = ['new' => 'جديد', 'confirmed' => 'مؤكد', 'shipped' => 'تم الشحن', 'delivered' => 'تم التوصيل', 'cancelled' => 'ملغي'];
admin_header('عميل بدون حساب', 'customers.php');
?>
<a href="<?= e(admin_url('customers.php?tab=guests')) ?>" class="admin-btn-ghost"><?= icon('arrow-left', 16) ?> رجوع للزبائن</a>
<div class="mt-4 flex flex-wrap items-center gap-3">
  <h1 class="text-2xl font-black sm:text-3xl"><?= e($name) ?></h1>
  <span class="badge bg-neutral-100 text-neutral-600">عميل بدون حساب</span>
</div>
<p class="mt-1 text-sm text-neutral-400" dir="ltr"><?= e($phone) ?></p>

<div class="mt-6 grid gap-4 sm:grid-cols-3">
  <div class="admin-card p-5"><p class="text-xs text-neutral-400">إجمالي المشتريات</p><p class="mt-1 text-2xl font-black"><?= e(format_price($spent)) ?></p></div>
  <div class="admin-card p-5"><p class="text-xs text-neutral-400">عدد الطلبات</p><p class="mt-1 text-2xl font-black"><?= count($orders) ?></p></div>
  <div class="admin-card p-5"><p class="text-xs text-neutral-400">متوسط الطلب</p><p class="mt-1 text-2xl font-black"><?= e(format_price($avg)) ?></p></div>
</div>

<div class="admin-card mt-5 p-6">
  <h2 class="mb-4 font-extrabold">التواصل</h2>
  <div class="flex flex-wrap items-center gap-3">
    <a href="tel:<?= e($phone) ?>" class="admin-btn"><?= icon('phone', 15) ?> اتصال</a>
    <a href="https://wa.me/<?= e(wa_number($phone)) ?>" target="_blank" rel="noopener" class="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white"><?= icon('whatsapp', 15) ?> مراسلة واتساب</a>
  </div>
</div>

<div class="admin-card mt-5 p-6">
  <h2 class="mb-4 font-extrabold">عناوين من طلباته</h2>
  <ul class="space-y-2">
    <?php foreach ($addrs as $a): ?>
      <li class="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-neutral-50 px-4 py-3 text-sm">
        <span class="font-bold"><?= e($a['city']) ?><?= $a['address'] ? ' — ' . e($a['address']) : '' ?></span>
        <span class="text-xs text-neutral-400"><?= (int)$a['n'] ?> <?= $a['n'] === 1 ? 'طلب' : 'طلبات' ?> · آخر استخدام <?= e(format_date($a['last'])) ?></span>
      </li>
    <?php endforeach; ?>
  </ul>
</div>

<div class="admin-card mt-5 overflow-x-auto p-6">
  <h2 class="mb-4 font-extrabold">طلباته</h2>
  <table class="admin-table w-full min-w-[520px]">
    <thead><tr><th>رقم الطلب</th><th>التاريخ</th><th>الحالة</th><th>الإجمالي</th></tr></thead>
    <tbody>
      <?php foreach ($orders as $o): ?>
        <tr>
          <td><a href="<?= e(admin_url('order.php?id=' . (int)$o['id'])) ?>" class="font-extrabold text-violet-700 hover:underline" dir="ltr"><?= e($o['code']) ?></a></td>
          <td class="text-neutral-500"><?= e(format_date($o['created_at'])) ?></td>
          <td class="font-bold"><?= e($STATUS[$o['status']] ?? $o['status']) ?></td>
          <td class="font-bold"><?= e(format_price((float)$o['total'])) ?></td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php admin_footer(); ?>
