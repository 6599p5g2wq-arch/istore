<?php
require_once __DIR__ . '/_init.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $id = (int)($_POST['id'] ?? 0);
    $p = $id ? qone('SELECT * FROM products WHERE id = ?', [$id]) : null;
    if ($p && $action === 'toggle') {
        q('UPDATE products SET active = 1 - active WHERE id = ?', [$id]);
        flash('تم تحديث حالة المنتج');
    } elseif ($p && $action === 'toggle_featured') {
        q('UPDATE products SET featured = 1 - featured WHERE id = ?', [$id]);
        flash('تم تحديث التمييز');
    } elseif ($p && $action === 'delete') {
        q('DELETE FROM products WHERE id = ?', [$id]);
        flash('تم حذف المنتج «' . $p['name'] . '»');
    }
    redirect_admin('products.php');
}
$search = trim($_GET['q'] ?? '');
$products = $search
    ? qall('SELECT p.*, c.name AS cat, b.name AS brand FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id WHERE p.name LIKE ? ORDER BY p.id DESC', ['%' . $search . '%'])
    : qall('SELECT p.*, c.name AS cat, b.name AS brand FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id ORDER BY p.id DESC');
admin_header('المنتجات', 'products.php');
?>
<div class="flex flex-wrap items-center justify-between gap-3">
  <h1 class="text-2xl font-black sm:text-3xl">المنتجات <span class="text-base font-bold text-neutral-400">(<span id="products-count"><?= count($products) ?></span>)</span></h1>
  <a href="<?= e(admin_url('product-form.php')) ?>" class="admin-btn"><?= icon('plus', 16) ?> منتج جديد</a>
</div>
<?php admin_msg(); ?>
<form class="mt-5 flex gap-2">
  <input id="products-search" name="q" value="<?= e($search) ?>" placeholder="بحث بالاسم..." autocomplete="off" class="admin-input max-w-xs">
  <button class="admin-btn-ghost"><?= icon('search', 16) ?> بحث</button>
</form>
<div class="admin-card mt-5 overflow-x-auto">
  <table class="admin-table w-full min-w-[760px]">
    <thead><tr><th>المنتج</th><th>التصنيف</th><th>الماركة</th><th>السعر</th><th>المخزون</th><th>مميز</th><th>ظاهر</th><th></th></tr></thead>
    <tbody>
      <tr id="products-empty" style="display:none"><td colspan="8" class="p-6 text-center text-sm font-bold text-neutral-400">لا توجد منتجات مطابقة</td></tr>
    <?php foreach ($products as $p): ?>
      <tr data-name="<?= e(mb_strtolower($p['name'])) ?>" class="js-product-row <?= $p['active'] ? '' : 'opacity-50' ?>">
        <td><div class="flex items-center gap-3"><img src="<?= e(img_url($p['image'])) ?>" class="h-11 w-11 rounded-xl object-cover" alt=""><a href="<?= e(admin_url('product-form.php?id=' . (int)$p['id'])) ?>" class="max-w-[220px] truncate font-bold hover:text-violet-700"><?= e($p['name']) ?></a></div></td>
        <td><?= e($p['cat'] ?? '—') ?></td>
        <td><?= e($p['brand'] ?? '—') ?></td>
        <td class="font-bold"><?= e(format_price((float)$p['price'])) ?></td>
        <td class="<?= $p['stock'] <= 5 ? 'font-bold text-red-600' : '' ?>"><?= (int)$p['stock'] ?></td>
        <td><form method="post" class="inline"><input type="hidden" name="action" value="toggle_featured"><input type="hidden" name="id" value="<?= (int)$p['id'] ?>"><button class="<?= $p['featured'] ? 'text-amber-500' : 'text-neutral-300' ?>" title="تمييز"><?= icon('star', 18) ?></button></form></td>
        <td><form method="post" class="inline"><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= (int)$p['id'] ?>"><button class="<?= $p['active'] ? 'text-emerald-600' : 'text-neutral-300' ?>" title="إظهار/إخفاء"><?= icon('eye', 18) ?></button></form></td>
        <td class="whitespace-nowrap">
          <a href="<?= e(admin_url('product-form.php?id=' . (int)$p['id'])) ?>" class="mr-2 inline-block text-neutral-500 hover:text-violet-700" title="تعديل"><?= icon('edit', 17) ?></a>
          <form method="post" class="inline" onsubmit="return confirm('حذف المنتج نهائياً؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$p['id'] ?>"><button class="text-neutral-400 hover:text-red-600" title="حذف"><?= icon('trash', 17) ?></button></form>
        </td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$products): ?><tr><td colspan="8" class="py-10 text-center text-neutral-400">لا توجد منتجات</td></tr><?php endif; ?>
    </tbody>
  </table>
  <script>
  // بحث حي: يفلتر مع كل حرف بدون زر، وتفريغ الحقل يعيد كل المنتجات
  (function () {
    var input = document.getElementById('products-search');
    if (!input) return;
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase(), visible = 0;
      document.querySelectorAll('.js-product-row').forEach(function (row) {
        var show = !q || (row.dataset.name || '').indexOf(q) !== -1;
        row.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      document.getElementById('products-count').textContent = visible;
      document.getElementById('products-empty').style.display = visible === 0 ? '' : 'none';
    });
  })();
  </script>
</div>
<?php admin_footer(); ?>
