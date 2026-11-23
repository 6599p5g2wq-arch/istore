<?php
require_once __DIR__ . '/_init.php';
require_admin();
$status = $_GET['status'] ?? '';
$valid = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];
$q = trim($_GET['q'] ?? '');
$periods = ['all' => 'كل الفترات', 'today' => 'اليوم', 'week' => 'الأسبوع', 'month' => 'الشهر'];
$period = array_key_exists($_GET['period'] ?? '', $periods) ? $_GET['period'] : 'all';
$page = max(1, (int)($_GET['page'] ?? 1));
$PER_PAGE = 20;

$conds = [];
$args = [];
if (in_array($status, $valid, true)) { $conds[] = 'status = ?'; $args[] = $status; }
if ($period === 'today') $conds[] = 'DATE(created_at) = CURDATE()';
if ($period === 'week') $conds[] = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
if ($period === 'month') $conds[] = "created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')";
if ($q !== '') {
    $conds[] = '(code LIKE ? OR customer_name LIKE ? OR phone LIKE ?)';
    $like = '%' . $q . '%';
    $args[] = $like; $args[] = $like; $args[] = $like;
}
$where = $conds ? ' WHERE ' . implode(' AND ', $conds) : '';

$agg = qone("SELECT COUNT(*) c, COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total END), 0) v FROM orders$where", $args);
$totalCount = (int)$agg['c'];
$totalValue = (float)$agg['v'];
$pages = max(1, (int)ceil($totalCount / $PER_PAGE));
$page = min($page, $pages);
$offset = ($page - 1) * $PER_PAGE;
$orders = qall("SELECT * FROM orders$where ORDER BY id DESC LIMIT $PER_PAGE OFFSET $offset", $args);

$counts = [];
foreach (qall('SELECT status, COUNT(*) c FROM orders GROUP BY status') as $r) $counts[$r['status']] = (int)$r['c'];
$total = array_sum($counts);
$repeatPhones = [];
foreach (qall('SELECT phone FROM orders GROUP BY phone HAVING COUNT(*) > 1') as $r) $repeatPhones[$r['phone']] = true;

// رابط يحافظ على الفلاتر الحالية مع تعديل جزء منها
function orders_url(array $over = []): string {
    global $status, $q, $period, $page;
    $p = array_merge(['status' => $status, 'q' => $q, 'period' => $period, 'page' => ''], $over);
    $parts = [];
    foreach ($p as $k => $v) {
        if ($v === '' || $v === null) continue;
        if ($k === 'period' && $v === 'all') continue;
        $parts[] = urlencode($k) . '=' . urlencode((string)$v);
    }
    return admin_url('orders.php' . ($parts ? '?' . implode('&', $parts) : ''));
}

admin_header('الطلبات', 'orders.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">الطلبات</h1>
<?php admin_msg(); ?>

<div class="mt-5 flex flex-wrap items-center gap-2">
  <form method="get" action="<?= e(admin_url('orders.php')) ?>" class="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm">
    <?php if ($status): ?><input type="hidden" name="status" value="<?= e($status) ?>"><?php endif; ?>
    <?php if ($period !== 'all'): ?><input type="hidden" name="period" value="<?= e($period) ?>"><?php endif; ?>
    <?= icon('search', 16, 'shrink-0 text-neutral-400') ?>
    <input name="q" value="<?= e($q) ?>" placeholder="ابحث برقم الطلب، اسم العميل، أو الهاتف…" class="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400">
    <button class="shrink-0 rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-bold text-white">بحث</button>
  </form>
  <div class="flex gap-1.5">
    <?php foreach ($periods as $k => $label): ?>
      <a href="<?= e(orders_url(['period' => $k, 'page' => ''])) ?>" class="rounded-full px-3.5 py-2 text-xs font-bold <?= $period === $k ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 shadow-sm' ?>"><?= e($label) ?></a>
    <?php endforeach; ?>
  </div>
</div>
<p class="mt-2 text-xs font-bold text-neutral-400">
  <?= $totalCount ?> طلب<?= $period !== 'all' ? ' (' . e($periods[$period]) . ')' : '' ?><?= $q !== '' ? ' لبحث «' . e($q) . '»' : '' ?> · إجمالي القيمة <?= e(format_price($totalValue)) ?> <span class="font-normal">(بدون الملغية)</span>
</p>

<div class="mt-4 flex flex-wrap gap-2">
  <a href="<?= e(orders_url(['status' => '', 'page' => ''])) ?>" class="rounded-full px-4 py-1.5 text-sm font-bold <?= $status === '' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600' ?>">الكل (<?= $total ?>)</a>
  <?php foreach ($valid as $v): ?>
    <a href="<?= e(orders_url(['status' => $v, 'page' => ''])) ?>" class="rounded-full px-4 py-1.5 text-sm font-bold <?= $status === $v ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600' ?>"><?= e(order_status_label($v)) ?> (<?= $counts[$v] ?? 0 ?>)</a>
  <?php endforeach; ?>
</div>

<?php if (!$orders): ?>
  <div class="admin-card mt-5 p-12 text-center text-neutral-400">لا توجد طلبات مطابقة</div>
<?php else: ?>

  <!-- بطاقات الموبايل -->
  <div class="mt-5 space-y-3 lg:hidden">
    <?php foreach ($orders as $o): ?>
      <a href="<?= e(admin_url('order.php?id=' . (int)$o['id'])) ?>" class="block rounded-3xl bg-white p-4 shadow-sm <?= $o['status'] === 'new' ? 'border-r-4 border-amber-400' : '' ?>">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="flex flex-wrap items-center gap-2">
              <span class="font-extrabold text-violet-700" dir="ltr"><?= e($o['code']) ?></span>
              <?php if ($o['status'] === 'new'): ?><span class="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white">جديد</span><?php endif; ?>
              <?php if (isset($repeatPhones[$o['phone']])): ?><span class="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">زبون متكرر</span><?php endif; ?>
            </p>
            <p class="mt-1 font-bold"><?= e($o['customer_name']) ?></p>
            <p class="mt-0.5 text-xs text-neutral-400"><span dir="ltr"><?= e($o['phone']) ?></span> · <?= e($o['city']) ?> · <?= e(format_date($o['created_at'])) ?></p>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-2">
            <p class="font-black"><?= e(format_price((float)$o['total'])) ?></p>
            <span class="badge <?= order_status_class($o['status']) ?>"><?= e(order_status_label($o['status'])) ?></span>
          </div>
        </div>
      </a>
    <?php endforeach; ?>
  </div>

  <!-- جدول الديسكتوب -->
  <div class="admin-card mt-5 hidden overflow-x-auto lg:block">
    <table class="admin-table w-full min-w-[760px]">
      <thead><tr><th>الطلب</th><th>العميل</th><th>الهاتف</th><th>المدينة</th><th>الإجمالي</th><th>الحالة</th><th>التاريخ</th></tr></thead>
      <tbody>
      <?php foreach ($orders as $o): ?>
        <tr class="cursor-pointer hover:bg-neutral-50 <?= $o['status'] === 'new' ? 'border-r-4 border-amber-400 bg-amber-50/40' : '' ?>" onclick="if(!event.target.closest('a,button,select'))location.href='<?= e(admin_url('order.php?id=' . (int)$o['id'])) ?>'">
          <td>
            <span class="flex items-center gap-2">
              <a href="<?= e(admin_url('order.php?id=' . (int)$o['id'])) ?>" class="font-extrabold text-violet-700 hover:underline" dir="ltr"><?= e($o['code']) ?></a>
              <?php if ($o['status'] === 'new'): ?><span class="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white">جديد</span><?php endif; ?>
            </span>
          </td>
          <td class="font-bold"><?= e($o['customer_name']) ?><?php if (isset($repeatPhones[$o['phone']])): ?> <span class="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">زبون متكرر</span><?php endif; ?></td>
          <td dir="ltr"><?= e($o['phone']) ?></td>
          <td><?= e($o['city']) ?></td>
          <td class="font-bold"><?= e(format_price((float)$o['total'])) ?></td>
          <td><span class="badge <?= order_status_class($o['status']) ?>"><?= e(order_status_label($o['status'])) ?></span></td>
          <td class="text-neutral-500"><?= e(format_date($o['created_at'])) ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
<?php endif; ?>

<?php if ($pages > 1): ?>
  <div class="mt-6 flex items-center justify-center gap-2 text-sm font-bold">
    <?php if ($page > 1): ?><a href="<?= e(orders_url(['page' => $page - 1])) ?>" class="rounded-xl bg-white px-4 py-2 shadow-sm">‹ السابق</a><?php endif; ?>
    <?php for ($n = 1; $n <= min($pages, 7); $n++): ?>
      <a href="<?= e(orders_url(['page' => $n])) ?>" class="rounded-xl px-4 py-2 shadow-sm <?= $n === $page ? 'bg-neutral-900 text-white' : 'bg-white' ?>"><?= $n ?></a>
    <?php endfor; ?>
    <?php if ($page < $pages): ?><a href="<?= e(orders_url(['page' => $page + 1])) ?>" class="rounded-xl bg-white px-4 py-2 shadow-sm">التالي ›</a><?php endif; ?>
  </div>
<?php endif; ?>

<?php admin_footer(); ?>
