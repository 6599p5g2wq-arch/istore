<?php
require_once __DIR__ . '/_init.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $id = (int)($_POST['id'] ?? 0);
    $r = $id ? qone('SELECT * FROM reviews WHERE id = ?', [$id]) : null;
    if ($r && $action === 'toggle') {
        q('UPDATE reviews SET approved = 1 - approved WHERE id = ?', [$id]);
        q('UPDATE products SET rating = (SELECT COALESCE(ROUND(AVG(rating), 1), rating) FROM reviews WHERE product_id = ? AND approved = 1) WHERE id = ?', [$r['product_id'], $r['product_id']]);
    } elseif ($r && $action === 'delete') {
        q('DELETE FROM reviews WHERE id = ?', [$id]);
        q('UPDATE products p SET rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = ? AND approved = 1), p.rating) WHERE id = ?', [$r['product_id'], $r['product_id']]);
        flash('تم حذف التقييم');
    }
    redirect_admin('reviews.php');
}
$reviews = qall('SELECT r.*, p.name AS product_name, p.slug FROM reviews r JOIN products p ON p.id = r.product_id ORDER BY r.id DESC LIMIT 200');
admin_header('التقييمات', 'reviews.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">التقييمات <span class="text-base font-bold text-neutral-400">(<?= count($reviews) ?>)</span></h1>
<?php admin_msg(); ?>
<div class="mt-6 space-y-3">
  <?php foreach ($reviews as $r): ?>
    <div class="admin-card flex flex-wrap items-start justify-between gap-4 p-5 <?= $r['approved'] ? '' : 'opacity-60' ?>">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <b><?= e($r['customer_name']) ?></b>
          <span class="text-amber-500"><?php for ($i = 0; $i < (int)$r['rating']; $i++) echo '★'; ?><span class="text-neutral-300"><?php for ($i = (int)$r['rating']; $i < 5; $i++) echo '★'; ?></span></span>
          <span class="badge <?= $r['approved'] ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500' ?>"><?= $r['approved'] ? 'معروض' : 'مخفي' ?></span>
        </div>
        <a href="<?= e(url('product.php?slug=' . rawurlencode($r['slug']))) ?>" target="_blank" class="mt-1 block text-sm font-bold text-violet-700 hover:underline"><?= e($r['product_name']) ?></a>
        <?php if ($r['comment']): ?><p class="mt-2 text-sm leading-7 text-neutral-600"><?= e($r['comment']) ?></p><?php endif; ?>
        <p class="mt-1 text-xs text-neutral-400" dir="ltr"><?= e($r['order_code']) ?> — <?= e($r['created_at']) ?></p>
      </div>
      <div class="flex shrink-0 gap-2">
        <form method="post"><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= (int)$r['id'] ?>"><button class="admin-btn-ghost"><?= $r['approved'] ? 'إخفاء' : 'عرض' ?></button></form>
        <form method="post" onsubmit="return confirm('حذف التقييم؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$r['id'] ?>"><button class="admin-btn-ghost admin-btn-danger"><?= icon('trash', 15) ?></button></form>
      </div>
    </div>
  <?php endforeach; ?>
  <?php if (!$reviews): ?><div class="admin-card py-16 text-center text-neutral-400">لا توجد تقييمات بعد</div><?php endif; ?>
</div>
<?php admin_footer(); ?>
