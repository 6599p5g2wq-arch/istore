<?php
require_once __DIR__ . '/_init.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = (int)($_POST['id'] ?? 0);
    $action = $_POST['action'] ?? '';
    if ($action === 'reminded' && $id) { q('UPDATE cart_leads SET reminded = 1 WHERE id = ?', [$id]); flash('تم تعليم السلة كمُتابَعة'); }
    if ($action === 'delete' && $id) { q('DELETE FROM cart_leads WHERE id = ?', [$id]); flash('تم الحذف'); }
    redirect_admin('leads.php');
}
$leads = qall('SELECT * FROM cart_leads ORDER BY updated_at DESC LIMIT 200');
admin_header('السلات المهجورة', 'leads.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">السلات المهجورة</h1>
<p class="mt-1 text-sm text-neutral-500">زبائن أدخلوا رقم هاتفهم في صفحة الدفع ولم يكملوا الطلب — تواصل معهم عبر واتساب</p>
<?php admin_msg(); ?>
<div class="mt-6 space-y-3">
  <?php foreach ($leads as $l):
    $items = json_decode($l['items'], true) ?: []; ?>
    <div class="admin-card flex flex-wrap items-center justify-between gap-4 p-5 <?= $l['reminded'] ? 'opacity-60' : '' ?>">
      <div class="min-w-0">
        <b dir="ltr" class="text-lg"><?= e($l['phone']) ?></b>
        <p class="mt-1 text-sm text-neutral-500"><?= count($items) ?> منتج — <b><?= e(format_price((float)$l['total'])) ?></b> — آخر نشاط <?= e(format_date($l['updated_at'])) ?></p>
        <p class="mt-1 text-xs text-neutral-400"><?= e(implode('، ', array_map(fn($i) => ($i['name'] ?? '') . ' × ' . ($i['qty'] ?? 1), array_slice($items, 0, 4)))) ?></p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <a href="https://wa.me/<?= e(preg_replace('/\D+/', '', preg_replace('/^0/', '218', $l['phone']))) ?>?text=<?= rawurlencode('مرحباً! لاحظنا أنك لم تكمل طلبك من ' . setting('store_name', 'متجرنا') . '. هل تحتاج مساعدة؟') ?>" target="_blank" rel="noopener" class="admin-btn-ghost"><?= icon('whatsapp', 15) ?> تذكير</a>
        <?php if (!$l['reminded']): ?><form method="post"><input type="hidden" name="action" value="reminded"><input type="hidden" name="id" value="<?= (int)$l['id'] ?>"><button class="admin-btn-ghost">تم التواصل</button></form><?php endif; ?>
        <form method="post" onsubmit="return confirm('حذف؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$l['id'] ?>"><button class="admin-btn-ghost admin-btn-danger"><?= icon('trash', 15) ?></button></form>
      </div>
    </div>
  <?php endforeach; ?>
  <?php if (!$leads): ?><div class="admin-card py-16 text-center text-neutral-400">لا توجد سلات مهجورة</div><?php endif; ?>
</div>
<?php admin_footer(); ?>
