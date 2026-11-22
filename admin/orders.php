<?php
require_once __DIR__ . '/_init.php';
require_admin();
$status = $_GET['status'] ?? '';
$valid = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];
$orders = in_array($status, $valid, true)
    ? qall('SELECT * FROM orders WHERE status = ? ORDER BY id DESC LIMIT 200', [$status])
    : qall('SELECT * FROM orders ORDER BY id DESC LIMIT 200');
$counts = [];
foreach (qall('SELECT status, COUNT(*) c FROM orders GROUP BY status') as $r) $counts[$r['status']] = (int)$r['c'];
$total = array_sum($counts);
admin_header('الطلبات', 'orders.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">الطلبات <span class="text-base font-bold text-neutral-400">(<?= $total ?>)</span></h1>
<?php admin_msg(); ?>
<div class="mt-5 flex flex-wrap gap-2">
  <a href="<?= e(admin_url('orders.php')) ?>" class="rounded-full px-4 py-1.5 text-sm font-bold <?= $status === '' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600' ?>">الكل (<?= $total ?>)</a>
  <?php foreach ($valid as $v): ?>
    <a href="<?= e(admin_url('orders.php?status=' . $v)) ?>" class="rounded-full px-4 py-1.5 text-sm font-bold <?= $status === $v ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600' ?>"><?= e(order_status_label($v)) ?> (<?= $counts[$v] ?? 0 ?>)</a>
  <?php endforeach; ?>
</div>
<div class="admin-card mt-5 overflow-x-auto">
  <table class="admin-table w-full min-w-[760px]">
    <thead><tr><th>الطلب</th><th>العميل</th><th>الهاتف</th><th>المدينة</th><th>الإجمالي</th><th>الحالة</th><th>التاريخ</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($orders as $o): ?>
      <tr>
        <td dir="ltr" class="font-bold"><?= e($o['code']) ?></td>
        <td><?= e($o['customer_name']) ?></td>
        <td dir="ltr"><?= e($o['phone']) ?></td>
        <td><?= e($o['city']) ?></td>
        <td class="font-bold"><?= e(format_price((float)$o['total'])) ?></td>
        <td><span class="badge <?= order_status_class($o['status']) ?>"><?= e(order_status_label($o['status'])) ?></span></td>
        <td class="text-neutral-500"><?= e(format_date($o['created_at'])) ?></td>
        <td><a href="<?= e(admin_url('order.php?id=' . (int)$o['id'])) ?>" class="font-bold text-violet-700 hover:underline">عرض</a></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$orders): ?><tr><td colspan="8" class="py-10 text-center text-neutral-400">لا توجد طلبات</td></tr><?php endif; ?>
    </tbody>
  </table>
</div>
<?php admin_footer(); ?>
