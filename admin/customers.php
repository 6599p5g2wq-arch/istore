<?php
require_once __DIR__ . '/_init.php';
require_admin();
$tab = ($_GET['tab'] ?? '') === 'guests' ? 'guests' : 'accounts';
$sorts = ['new' => ['الأحدث', 'c.id DESC'], 'spent' => ['الأكثر شراءً', 'spent DESC'], 'orders' => ['الأكثر طلبات', 'oc DESC']];
$sort = isset($sorts[$_GET['sort'] ?? '']) ? $_GET['sort'] : 'new';
$accCount = (int)qone('SELECT COUNT(*) c FROM customers')['c'];
$guestCount = (int)qone('SELECT COUNT(DISTINCT phone) c FROM orders WHERE customer_id IS NULL')['c'];
$accounts = $guests = [];
if ($tab === 'accounts') {
    $accounts = qall("SELECT c.id, c.name, c.email, c.phone, c.created_at, c.blocked, c.points, c.vip_override, COUNT(o.id) oc,
        COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total END), 0) spent, MAX(o.created_at) last_order
        FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id, c.name, c.email, c.phone, c.created_at, c.blocked, c.points, c.vip_override ORDER BY " . $sorts[$sort][1]);
} else {
    $guests = qall("SELECT MAX(customer_name) name, phone, COUNT(*) oc, COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total END), 0) spent, MAX(created_at) last_order
        FROM orders WHERE customer_id IS NULL GROUP BY phone ORDER BY last_order DESC");
}
admin_header('الزبائن', 'customers.php');
?>
<div class="flex flex-wrap items-center justify-between gap-3">
  <h1 class="text-2xl font-black sm:text-3xl">الزبائن</h1>
  <a href="<?= e(admin_url('customers-export.php?tab=' . $tab)) ?>" class="admin-btn-ghost"><?= icon('download', 16) ?> تصدير CSV</a>
</div>
<?php admin_msg(); ?>
<div class="mt-5 flex flex-wrap gap-2">
  <a href="<?= e(admin_url('customers.php')) ?>" class="rounded-full px-4 py-1.5 text-sm font-bold <?= $tab === 'accounts' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600' ?>">حسابات مسجلة (<?= $accCount ?>)</a>
  <a href="<?= e(admin_url('customers.php?tab=guests')) ?>" class="rounded-full px-4 py-1.5 text-sm font-bold <?= $tab === 'guests' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600' ?>">عملاء بدون حساب (<?= $guestCount ?>)</a>
</div>
<?php if ($tab === 'accounts'): ?>
<div class="mt-4 flex flex-wrap items-center gap-3">
  <input id="cust-q" oninput="filterCustomers(this.value)" placeholder="ابحث بالاسم أو الهاتف أو البريد…" autocomplete="off" class="admin-input max-w-md">
  <div class="flex gap-2 text-xs font-bold">
    <?php foreach ($sorts as $k => $v): ?>
      <a href="<?= e(admin_url('customers.php?sort=' . $k)) ?>" class="rounded-full px-3 py-1.5 <?= $sort === $k ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500' ?>"><?= e($v[0]) ?></a>
    <?php endforeach; ?>
  </div>
</div>
<div class="admin-card mt-4 overflow-x-auto">
  <table class="admin-table w-full min-w-[860px]">
    <thead><tr><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>الطلبات</th><th>إجمالي المشتريات</th><th>النقاط</th><th>آخر طلب</th><th>التسجيل</th></tr></thead>
    <tbody>
    <?php foreach ($accounts as $c): ?>
      <tr class="cust-row" data-search="<?= e(mb_strtolower($c['name'] . ' ' . $c['phone'] . ' ' . $c['email'])) ?>">
        <td><a href="<?= e(admin_url('customer.php?id=' . (int)$c['id'])) ?>" class="font-extrabold text-violet-700 hover:underline"><?= e($c['name']) ?></a><?php if (is_vip((float)$c['spent'], $c['vip_override'])): ?> <span class="badge bg-amber-100 text-amber-700">★ VIP</span><?php endif; ?><?php if ($c['blocked']): ?> <span class="badge bg-red-100 text-red-600">موقوف</span><?php endif; ?></td>
        <td dir="ltr" class="text-neutral-500"><?= e($c['phone']) ?></td>
        <td dir="ltr" class="text-neutral-500"><?= e($c['email']) ?></td>
        <td class="font-bold"><?= (int)$c['oc'] ?></td>
        <td class="font-bold"><?= e(format_price((float)$c['spent'])) ?></td>
        <td class="font-bold"><?= (int)$c['points'] ?></td>
        <td class="text-neutral-500"><?= $c['last_order'] ? e(format_date($c['last_order'])) : '—' ?></td>
        <td class="text-neutral-500"><?= e(format_date($c['created_at'])) ?></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$accounts): ?><tr><td colspan="8" class="py-10 text-center text-neutral-400">لا توجد حسابات مسجلة بعد</td></tr><?php endif; ?>
    <tr id="cust-empty" style="display:none"><td colspan="8" class="py-10 text-center text-neutral-400">لا يوجد زبون مطابق</td></tr>
    </tbody>
  </table>
</div>
<script>
function filterCustomers(v) {
  var q = v.trim().toLowerCase(), n = 0;
  document.querySelectorAll('.cust-row').forEach(function (r) {
    var show = !q || (r.dataset.search || '').indexOf(q) !== -1;
    r.style.display = show ? '' : 'none';
    if (show) n++;
  });
  var e = document.getElementById('cust-empty');
  if (e) e.style.display = (n === 0 && document.querySelectorAll('.cust-row').length) ? '' : 'none';
}
</script>
<?php else: ?>
<div class="admin-card mt-4 overflow-x-auto">
  <table class="admin-table w-full min-w-[640px]">
    <thead><tr><th>الاسم</th><th>الهاتف</th><th>الطلبات</th><th>إجمالي المشتريات</th><th>آخر طلب</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($guests as $g): ?>
      <tr>
        <td class="font-bold"><?= e($g['name']) ?></td>
        <td dir="ltr" class="text-neutral-500"><?= e($g['phone']) ?></td>
        <td class="font-bold"><?= (int)$g['oc'] ?></td>
        <td class="font-bold"><?= e(format_price((float)$g['spent'])) ?></td>
        <td class="text-neutral-500"><?= e(format_date($g['last_order'])) ?></td>
        <td><a href="https://wa.me/<?= e(wa_number($g['phone'])) ?>" target="_blank" rel="noopener" class="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white">واتساب</a></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$guests): ?><tr><td colspan="6" class="py-10 text-center text-neutral-400">لا يوجد عملاء بدون حساب</td></tr><?php endif; ?>
    </tbody>
  </table>
</div>
<?php endif; ?>
<?php admin_footer(); ?>
