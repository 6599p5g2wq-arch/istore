<?php
require_once __DIR__ . '/_init.php';
require_admin();
$totals = [
    'orders' => (int)qone('SELECT COUNT(*) c FROM orders')['c'],
    'newOrders' => (int)qone("SELECT COUNT(*) c FROM orders WHERE status = 'new'")['c'],
    'products' => (int)qone('SELECT COUNT(*) c FROM products')['c'],
    'revenue' => (float)qone("SELECT COALESCE(SUM(total),0) t FROM orders WHERE status != 'cancelled'")['t'],
];
$recent = qall('SELECT * FROM orders ORDER BY id DESC LIMIT 8');
$lowStock = qall('SELECT id, name, stock FROM products WHERE active = 1 AND stock <= 5 ORDER BY stock ASC LIMIT 8');
$viewsToday = (int)qone('SELECT COUNT(*) c FROM page_views WHERE DATE(created_at) = CURDATE()')['c'];
$viewsWeek = (int)qone("SELECT COUNT(*) c FROM page_views WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")['c'];
$leadsCount = (int)qone('SELECT COUNT(*) c FROM cart_leads WHERE reminded = 0')['c'];
$customersCount = (int)qone('SELECT COUNT(*) c FROM customers')['c'];
$topPages = qall("SELECT path, COUNT(*) c FROM page_views WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY path ORDER BY c DESC LIMIT 6");
$days = [];
for ($i = 6; $i >= 0; $i--) {
    $row = qone("SELECT COALESCE(SUM(total),0) t, COUNT(*) c FROM orders WHERE status != 'cancelled' AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL $i DAY)");
    $days[] = ['day' => ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][date('w', strtotime("-$i days"))], 'total' => (float)$row['t'], 'count' => (int)$row['c']];
}
$maxDay = max(1, ...array_column($days, 'total'));
admin_header('لوحة المعلومات', 'index.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">مرحباً بك 👋</h1>
<p class="mt-1 text-neutral-500">نظرة سريعة على أداء متجرك</p>
<?php admin_msg(); ?>
<div class="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
  <div class="admin-card p-5"><div class="flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-white"><?= icon('banknote', 22) ?></span><div><p class="text-xs font-bold text-neutral-500">إجمالي المبيعات</p><p class="text-xl font-black"><?= e(format_price($totals['revenue'])) ?></p></div></div></div>
  <div class="admin-card p-5"><div class="flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500 text-white"><?= icon('shopping-cart', 22) ?></span><div><p class="text-xs font-bold text-neutral-500">الطلبات</p><p class="text-xl font-black"><?= $totals['orders'] ?></p></div></div></div>
  <div class="admin-card p-5"><div class="flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500 text-white"><?= icon('clock', 22) ?></span><div><p class="text-xs font-bold text-neutral-500">طلبات جديدة</p><p class="text-xl font-black"><?= $totals['newOrders'] ?></p></div></div></div>
  <div class="admin-card p-5"><div class="flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500 text-white"><?= icon('package', 22) ?></span><div><p class="text-xs font-bold text-neutral-500">المنتجات</p><p class="text-xl font-black"><?= $totals['products'] ?></p></div></div></div>
</div>

<div class="mt-6 grid gap-4 lg:grid-cols-3">
  <div class="admin-card p-6 lg:col-span-2">
    <h2 class="font-extrabold">مبيعات آخر 7 أيام</h2>
    <div class="mt-6 flex h-44 items-end gap-2">
      <?php foreach ($days as $d): $h = max(4, round($d['total'] / $maxDay * 100)); ?>
        <div class="flex flex-1 flex-col items-center gap-2">
          <span class="text-[10px] font-bold text-neutral-500"><?= $d['total'] > 0 ? e(format_price($d['total'])) : '' ?></span>
          <div class="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-fuchsia-400" style="height: <?= $h ?>%" title="<?= $d['count'] ?> طلب"></div>
          <span class="text-[11px] font-bold text-neutral-500"><?= e($d['day']) ?></span>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
  <div class="admin-card p-6">
    <h2 class="font-extrabold">الزيارات</h2>
    <div class="mt-5 space-y-4 text-sm">
      <div class="flex items-center justify-between"><span class="flex items-center gap-2 font-bold text-neutral-600"><?= icon('eye', 16) ?> اليوم</span><b><?= $viewsToday ?></b></div>
      <div class="flex items-center justify-between"><span class="flex items-center gap-2 font-bold text-neutral-600"><?= icon('eye', 16) ?> آخر 7 أيام</span><b><?= $viewsWeek ?></b></div>
      <div class="flex items-center justify-between"><span class="flex items-center gap-2 font-bold text-neutral-600"><?= icon('shopping-bag', 16) ?> سلات مهجورة</span><b><?= $leadsCount ?></b></div>
      <div class="flex items-center justify-between"><span class="flex items-center gap-2 font-bold text-neutral-600"><?= icon('users', 16) ?> العملاء المسجلون</span><b><?= $customersCount ?></b></div>
    </div>
    <?php if ($topPages): ?>
      <h3 class="mt-6 text-sm font-extrabold text-neutral-500">أكثر الصفحات زيارة</h3>
      <ul class="mt-2 space-y-1.5 text-xs">
        <?php foreach ($topPages as $tp): ?><li class="flex justify-between gap-2"><span class="truncate text-neutral-600" dir="ltr"><?= e($tp['path']) ?></span><b><?= (int)$tp['c'] ?></b></li><?php endforeach; ?>
      </ul>
    <?php endif; ?>
  </div>
</div>

<div class="mt-6 grid gap-4 lg:grid-cols-3">
  <div class="admin-card overflow-x-auto p-2 lg:col-span-2">
    <div class="flex items-center justify-between p-4"><h2 class="font-extrabold">أحدث الطلبات</h2><a href="<?= e(admin_url('orders.php')) ?>" class="text-sm font-bold text-violet-700 hover:underline">كل الطلبات</a></div>
    <table class="admin-table w-full">
      <thead><tr><th>الطلب</th><th>العميل</th><th>المدينة</th><th>الإجمالي</th><th>الحالة</th><th></th></tr></thead>
      <tbody>
      <?php foreach ($recent as $o): ?>
        <tr>
          <td dir="ltr" class="font-bold"><?= e($o['code']) ?></td>
          <td><?= e($o['customer_name']) ?></td>
          <td><?= e($o['city']) ?></td>
          <td class="font-bold"><?= e(format_price((float)$o['total'])) ?></td>
          <td><span class="badge <?= order_status_class($o['status']) ?>"><?= e(order_status_label($o['status'])) ?></span></td>
          <td><a href="<?= e(admin_url('order.php?id=' . (int)$o['id'])) ?>" class="font-bold text-violet-700 hover:underline">عرض</a></td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$recent): ?><tr><td colspan="6" class="py-10 text-center text-neutral-400">لا طلبات بعد</td></tr><?php endif; ?>
      </tbody>
    </table>
  </div>
  <div class="admin-card p-6">
    <h2 class="flex items-center gap-2 font-extrabold"><?= icon('alert-triangle', 18, 'text-amber-500') ?> مخزون منخفض</h2>
    <ul class="mt-4 space-y-2 text-sm">
      <?php foreach ($lowStock as $p): ?>
        <li class="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2"><span class="line-clamp-1"><?= e($p['name']) ?></span><b class="<?= $p['stock'] <= 0 ? 'text-red-600' : 'text-amber-600' ?>"><?= (int)$p['stock'] ?></b></li>
      <?php endforeach; ?>
      <?php if (!$lowStock): ?><li class="py-6 text-center text-neutral-400">المخزون بحالة جيدة</li><?php endif; ?>
    </ul>
  </div>
</div>
<?php admin_footer(); ?>
