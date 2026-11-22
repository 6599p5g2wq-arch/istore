<?php
require_once __DIR__ . '/_init.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = (int)($_POST['id'] ?? 0);
    $action = $_POST['action'] ?? '';
    if ($action === 'notified' && $id) { q('UPDATE stock_alerts SET notified = 1 WHERE id = ?', [$id]); flash('تم التعليم كمُشعَر'); }
    if ($action === 'delete' && $id) { q('DELETE FROM stock_alerts WHERE id = ?', [$id]); flash('تم الحذف'); }
    redirect_admin('stock-alerts.php');
}
$alerts = qall('SELECT a.*, p.name AS product_name, p.stock, p.slug FROM stock_alerts a JOIN products p ON p.id = a.product_id ORDER BY a.id DESC LIMIT 200');
admin_header('إشعارات التوفر', 'stock-alerts.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">إشعارات التوفر</h1>
<p class="mt-1 text-sm text-neutral-500">زبائن طلبوا تنبيههم عند توفر منتج نفد من المخزون</p>
<?php admin_msg(); ?>
<div class="admin-card mt-6 overflow-x-auto">
  <table class="admin-table w-full min-w-[640px]">
    <thead><tr><th>المنتج</th><th>المخزون الحالي</th><th>جهة الاتصال</th><th>التاريخ</th><th>الحالة</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($alerts as $a): ?>
      <tr class="<?= $a['notified'] ? 'opacity-50' : '' ?>">
        <td class="font-bold"><?= e($a['product_name']) ?></td>
        <td class="<?= $a['stock'] > 0 ? 'font-bold text-emerald-600' : 'text-red-600' ?>"><?= (int)$a['stock'] ?></td>
        <td dir="ltr"><?= e($a['contact']) ?></td>
        <td class="text-neutral-500"><?= e(format_date($a['created_at'])) ?></td>
        <td><span class="badge <?= $a['notified'] ? 'bg-neutral-100 text-neutral-500' : 'bg-amber-100 text-amber-700' ?>"><?= $a['notified'] ? 'تم الإشعار' : 'بانتظار' ?></span></td>
        <td class="whitespace-nowrap">
          <?php if (!$a['notified']): ?><form method="post" class="inline"><input type="hidden" name="action" value="notified"><input type="hidden" name="id" value="<?= (int)$a['id'] ?>"><button class="admin-btn-ghost">تم الإشعار</button></form><?php endif; ?>
          <form method="post" class="inline" onsubmit="return confirm('حذف؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$a['id'] ?>"><button class="mr-2 text-neutral-400 hover:text-red-600"><?= icon('trash', 16) ?></button></form>
        </td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$alerts): ?><tr><td colspan="6" class="py-10 text-center text-neutral-400">لا توجد طلبات إشعار</td></tr><?php endif; ?>
    </tbody>
  </table>
</div>
<?php admin_footer(); ?>
