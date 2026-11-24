<?php
require_once __DIR__ . '/_init.php';
require_admin();

$range = (isset($_GET['range']) && $_GET['range'] === '30') ? 30 : 7;

$totals = [
    'orders' => (int)qone('SELECT COUNT(*) c FROM orders')['c'],
    'newOrders' => (int)qone("SELECT COUNT(*) c FROM orders WHERE status = 'new'")['c'],
    'products' => (int)qone('SELECT COUNT(*) c FROM products')['c'],
    'revenue' => (float)qone("SELECT COALESCE(SUM(total),0) t FROM orders WHERE status != 'cancelled'")['t'],
];
$today = qone("SELECT COALESCE(SUM(total),0) t, COUNT(*) c FROM orders WHERE status != 'cancelled' AND DATE(created_at) = CURDATE()");
$yesterday = qone("SELECT COALESCE(SUM(total),0) t, COUNT(*) c FROM orders WHERE status != 'cancelled' AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)");

$recent = qall('SELECT * FROM orders ORDER BY id DESC LIMIT 8');
$lowStock = qall('SELECT id, name, stock FROM products WHERE active = 1 AND stock <= 5 ORDER BY stock ASC LIMIT 8');
$viewsToday = (int)qone('SELECT COUNT(*) c FROM page_views WHERE DATE(created_at) = CURDATE()')['c'];
$viewsWeek = (int)qone("SELECT COUNT(*) c FROM page_views WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")['c'];
$viewsPrevWeek = (int)qone("SELECT COUNT(*) c FROM page_views WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)")['c'];
$ordersWeek = (int)qone("SELECT COUNT(*) c FROM orders WHERE status != 'cancelled' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")['c'];
$ordersPrevWeek = (int)qone("SELECT COUNT(*) c FROM orders WHERE status != 'cancelled' AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)")['c'];
$convWeek = $viewsWeek > 0 ? $ordersWeek / $viewsWeek * 100 : 0.0;
$convPrevWeek = $viewsPrevWeek > 0 ? $ordersPrevWeek / $viewsPrevWeek * 100 : 0.0;
$leadsCount = (int)qone('SELECT COUNT(*) c FROM cart_leads WHERE reminded = 0')['c'];
$customersCount = (int)qone('SELECT COUNT(*) c FROM customers')['c'];
$topPages = qall("SELECT path, COUNT(*) c FROM page_views WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY path ORDER BY c DESC LIMIT 6");

$statusKeys = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];
$statusBarCls = ['new' => 'bg-amber-400', 'confirmed' => 'bg-blue-500', 'shipped' => 'bg-purple-500', 'delivered' => 'bg-emerald-500', 'cancelled' => 'bg-red-500'];
$statusMap = [];
foreach (qall("SELECT status, COUNT(*) c FROM orders WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') GROUP BY status") as $r) $statusMap[$r['status']] = (int)$r['c'];
$maxStatus = max(1, ...array_map(fn($k) => $statusMap[$k] ?? 0, $statusKeys));

$topProducts = qall("SELECT oi.name AS name, SUM(oi.qty) AS qty, SUM(oi.qty * oi.price) AS rev
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'cancelled' AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY oi.name ORDER BY qty DESC, rev DESC LIMIT 5");

$weekdays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
$days = [];
for ($i = $range - 1; $i >= 0; $i--) {
    $row = qone("SELECT COALESCE(SUM(total),0) t, COUNT(*) c FROM orders WHERE status != 'cancelled' AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL $i DAY)");
    $label = $range === 7 ? $weekdays[date('w', strtotime("-$i days"))] : date('j/n', strtotime("-$i days"));
    $days[] = ['day' => $label, 'total' => (float)$row['t'], 'count' => (int)$row['c'], 'show' => $range === 7 || $i % 5 === 0 || $i === 0];
}
$maxDay = max(1, ...array_column($days, 'total'));
$periodTotal = array_sum(array_column($days, 'total'));
$BAR_MAX = 110;

$months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
$todayStr = $weekdays[date('w')] . ' ' . date('j') . ' ' . $months[date('n') - 1] . ' ' . date('Y');

function delta_html(float $now, float $prev, string $label): string {
    if ($prev <= 0) {
        return '<p class="mt-1 text-[11px] font-bold text-neutral-400">' . ($now > 0 ? '▲ ' . e($label) . ': 0' : '—') . '</p>';
    }
    $pct = (int)round(($now - $prev) / $prev * 100);
    $up = $pct >= 0;
    return '<p class="mt-1 text-[11px] font-extrabold ' . ($up ? 'text-emerald-600' : 'text-red-500') . '">'
        . ($up ? '▲' : '▼') . ' ' . abs($pct) . '% <span class="font-bold text-neutral-400">' . e($label) . '</span></p>';
}

admin_header('لوحة المعلومات', 'index.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">مرحباً بك 👋</h1>
<p class="mt-1 text-neutral-500">نظرة سريعة على أداء متجرك — <?= e($todayStr) ?></p>
<?php admin_msg(); ?>

<div class="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
  <div class="admin-card p-5"><div class="dashboard-stat"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white"><?= icon('banknote', 22) ?></span><div><p class="dashboard-label">مبيعات اليوم</p><p class="dashboard-value"><?= e(format_price((float)$today['t'])) ?></p><?= delta_html((float)$today['t'], (float)$yesterday['t'], 'عن أمس') ?></div></div></div>
  <div class="admin-card p-5"><div class="dashboard-stat"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-500 text-white"><?= icon('shopping-cart', 22) ?></span><div><p class="dashboard-label">طلبات اليوم</p><p class="dashboard-value"><?= (int)$today['c'] ?></p><?= delta_html((float)$today['c'], (float)$yesterday['c'], 'عن أمس') ?></div></div></div>
  <a href="<?= e(admin_url('orders.php?status=new')) ?>" class="admin-card block p-5 transition hover:-translate-y-0.5 hover:shadow-md"><div class="dashboard-stat"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white"><?= icon('clock', 22) ?></span><div><p class="dashboard-label">طلبات جديدة</p><p class="dashboard-value"><?= $totals['newOrders'] ?></p><p class="mt-1 text-[11px] font-bold text-violet-700">اضغط للعرض والمعالجة ←</p></div></div></a>
  <div class="admin-card p-5"><div class="dashboard-stat"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-500 text-white"><?= icon('percent', 22) ?></span><div><p class="dashboard-label">معدل التحويل (زيارة ← طلب) هذا الأسبوع</p><p class="dashboard-value"><?= number_format($convWeek, 1) ?>%</p><?= delta_html(round($convWeek * 10), round($convPrevWeek * 10), 'عن الأسبوع الماضي') ?></div></div></div>
</div>

<div class="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
  <div class="admin-card p-5"><div class="dashboard-stat"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white"><?= icon('banknote', 22) ?></span><div><p class="dashboard-label">إجمالي المبيعات</p><p class="dashboard-value"><?= e(format_price($totals['revenue'])) ?></p></div></div></div>
  <a href="<?= e(admin_url('orders.php')) ?>" class="admin-card block p-5 transition hover:-translate-y-0.5 hover:shadow-md"><div class="dashboard-stat"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white"><?= icon('shopping-cart', 22) ?></span><div><p class="dashboard-label">كل الطلبات</p><p class="dashboard-value"><?= $totals['orders'] ?></p><p class="mt-1 text-[11px] font-bold text-violet-700">اضغط للعرض ←</p></div></div></a>
  <a href="<?= e(admin_url('products.php')) ?>" class="admin-card block p-5 transition hover:-translate-y-0.5 hover:shadow-md"><div class="dashboard-stat"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-purple-500 text-white"><?= icon('package', 22) ?></span><div><p class="dashboard-label">المنتجات</p><p class="dashboard-value"><?= $totals['products'] ?></p><p class="mt-1 text-[11px] font-bold text-violet-700">اضغط للإدارة ←</p></div></div></a>
  <div class="admin-card p-5"><div class="dashboard-stat"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-500 text-white"><?= icon('eye', 22) ?></span><div><p class="dashboard-label">زيارات اليوم (<?= $viewsWeek ?> هذا الأسبوع)</p><p class="dashboard-value"><?= $viewsToday ?></p></div></div></div>
</div>

<div class="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
  <a href="<?= e(admin_url('leads.php')) ?>" class="admin-card block p-5 transition hover:-translate-y-0.5 hover:shadow-md"><div class="dashboard-stat"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-500 text-white"><?= icon('shopping-bag', 22) ?></span><div><p class="dashboard-label">سلات مهجورة بانتظار التذكير</p><p class="dashboard-value"><?= $leadsCount ?></p><p class="mt-1 text-[11px] font-bold text-violet-700">اضغط للتذكير ←</p></div></div></a>
  <a href="<?= e(admin_url('customers.php')) ?>" class="admin-card block p-5 transition hover:-translate-y-0.5 hover:shadow-md"><div class="dashboard-stat"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-500 text-white"><?= icon('users', 22) ?></span><div><p class="dashboard-label">حسابات الزبائن</p><p class="dashboard-value"><?= $customersCount ?></p><p class="mt-1 text-[11px] font-bold text-violet-700">اضغط للعرض ←</p></div></div></a>
  <div class="admin-card p-5 lg:col-span-2">
    <h2 class="mb-2 text-sm font-extrabold">أكثر الصفحات زيارة (7 أيام)</h2>
    <?php if ($topPages): ?>
      <ul class="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <?php foreach ($topPages as $tp): ?><li class="flex justify-between gap-2"><span class="truncate text-neutral-500" dir="ltr"><?= e($tp['path']) ?></span><b><?= (int)$tp['c'] ?></b></li><?php endforeach; ?>
      </ul>
    <?php else: ?><p class="text-xs text-neutral-400">لا بيانات بعد</p><?php endif; ?>
  </div>
</div>

<div class="mt-6 grid gap-4 lg:grid-cols-5">
  <div class="admin-card p-6 lg:col-span-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="font-extrabold">مبيعات آخر <?= $range === 7 ? '7 أيام' : '30 يوماً' ?></h2>
      <div class="flex rounded-xl bg-neutral-100 p-1 text-xs font-bold">
        <a href="<?= e(admin_url('index.php')) ?>" class="<?= $range === 7 ? 'rounded-lg bg-neutral-900 px-3 py-1.5 text-white' : 'px-3 py-1.5 text-neutral-500 hover:text-neutral-800' ?>">7 أيام</a>
        <a href="<?= e(admin_url('index.php?range=30')) ?>" class="<?= $range === 30 ? 'rounded-lg bg-neutral-900 px-3 py-1.5 text-white' : 'px-3 py-1.5 text-neutral-500 hover:text-neutral-800' ?>">30 يوم</a>
      </div>
    </div>
    <div class="mt-6 flex h-44 items-end justify-between gap-2">
      <?php foreach ($days as $idx => $d): $h = max(3, (int)round($d['total'] / $maxDay * $BAR_MAX)); $isToday = $idx === count($days) - 1; ?>
        <div class="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span class="text-[10px] font-bold text-neutral-500"><?= $range === 7 && $d['total'] > 0 ? e(format_price($d['total'])) : '' ?></span>
          <div class="w-full max-w-10 rounded-t-lg <?= $isToday ? 'bg-emerald-500' : 'bg-gradient-to-t from-violet-600 to-fuchsia-400' ?>" style="height: <?= $h ?>px" title="<?= e(format_price($d['total'])) ?> · <?= $d['count'] ?> طلب"></div>
          <span class="text-[10px] font-bold text-neutral-500"><?= $d['show'] ? e($d['day']) : '' ?></span>
        </div>
      <?php endforeach; ?>
    </div>
    <p class="mt-4 border-t border-neutral-100 pt-3 text-xs font-bold text-neutral-500">
      إجمالي الفترة: <?= e(format_price($periodTotal)) ?> · متوسط يومي: <?= e(format_price(round($periodTotal / $range))) ?>
    </p>
  </div>
  <div class="admin-card p-6 lg:col-span-2">
    <h2 class="flex items-center gap-2 font-extrabold"><?= icon('package', 18, 'text-violet-500') ?> الطلبات حسب الحالة (هذا الشهر)</h2>
    <div class="mt-4 space-y-3">
      <?php foreach ($statusKeys as $k): $c = $statusMap[$k] ?? 0; ?>
        <a href="<?= e(admin_url('orders.php?status=' . $k)) ?>" class="group flex items-center gap-3">
          <span class="w-20 shrink-0 text-xs font-bold text-neutral-600 group-hover:text-neutral-900"><?= e(order_status_label($k)) ?></span>
          <span class="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
            <span class="block h-full rounded-full <?= $statusBarCls[$k] ?>" style="width: <?= $c === 0 ? 0 : max(6, round($c / $maxStatus * 100)) ?>%"></span>
          </span>
          <b class="w-6 text-left text-xs"><?= $c ?></b>
        </a>
      <?php endforeach; ?>
    </div>
    <p class="mt-4 text-[11px] font-bold text-violet-700">كل حالة رابط يفتح قائمة الطلبات مفلترة عليها</p>
  </div>
</div>

<div class="mt-6 grid gap-4 lg:grid-cols-5">
  <div class="admin-card p-6 lg:col-span-3">
    <h2 class="flex items-center gap-2 font-extrabold"><?= icon('star', 18, 'text-amber-500') ?> أكثر المنتجات مبيعاً (30 يوماً)</h2>
    <?php if ($topProducts): ?>
      <ul class="mt-4 space-y-2 text-sm">
        <?php foreach ($topProducts as $i => $p): ?>
          <li class="flex items-center gap-3 rounded-xl bg-neutral-50 px-4 py-2.5">
            <span class="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-neutral-900 text-xs font-black text-white"><?= $i + 1 ?></span>
            <span class="line-clamp-1 flex-1 font-bold"><?= e($p['name']) ?></span>
            <span class="shrink-0 text-xs font-extrabold text-emerald-600"><?= (int)$p['qty'] ?> قطعة · <?= e(format_price((float)$p['rev'])) ?></span>
          </li>
        <?php endforeach; ?>
      </ul>
    <?php else: ?><p class="py-6 text-center text-sm text-neutral-400">لا مبيعات في آخر 30 يوماً</p><?php endif; ?>
  </div>
  <div class="admin-card p-6 lg:col-span-2">
    <h2 class="flex items-center gap-2 font-extrabold"><?= icon('alert-triangle', 18, 'text-amber-500') ?> مخزون منخفض</h2>
    <ul class="mt-4 space-y-2 text-sm">
      <?php foreach ($lowStock as $p): ?>
        <li><a href="<?= e(admin_url('product-form.php?id=' . (int)$p['id'])) ?>" class="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 transition hover:bg-neutral-200/60"><span class="line-clamp-1"><?= e($p['name']) ?></span><b class="<?= $p['stock'] <= 0 ? 'text-red-600' : 'text-amber-600' ?>"><?= (int)$p['stock'] ?></b></a></li>
      <?php endforeach; ?>
      <?php if (!$lowStock): ?><li class="py-6 text-center text-neutral-400">المخزون بحالة جيدة</li><?php endif; ?>
    </ul>
  </div>
</div>

<div class="admin-card mt-6 overflow-x-auto p-2">
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
<?php admin_footer(); ?>
