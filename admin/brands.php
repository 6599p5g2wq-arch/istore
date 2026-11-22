<?php
require_once __DIR__ . '/_init.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $id = (int)($_POST['id'] ?? 0);
    if ($action === 'save') {
        $name = mb_substr(trim($_POST['name'] ?? ''), 0, 200);
        $slug = trim($_POST['slug'] ?? '') ?: trim(preg_replace('/[^\p{L}\p{N}]+/u', '-', $name), '-');
        $image = trim($_POST['image'] ?? '');
        $up = handle_image_upload('image_file'); if ($up) $image = $up;
        $sort = (int)($_POST['sort_order'] ?? 0);
        $active = !empty($_POST['active']) ? 1 : 0;
        if (!$name) { flash('الاسم مطلوب', true); redirect_admin('brands.php'); }
        $dup = qone('SELECT id FROM brands WHERE slug = ? AND id != ?', [$slug, $id]);
        if ($dup) $slug .= '-' . substr(bin2hex(random_bytes(2)), 0, 4);
        if ($id) { q('UPDATE brands SET name=?, slug=?, image=?, sort_order=?, active=? WHERE id=?', [$name, $slug, $image, $sort, $active, $id]); flash('تم حفظ الماركة'); }
        else { q('INSERT INTO brands (name, slug, image, sort_order, active) VALUES (?, ?, ?, ?, ?)', [$name, $slug, $image, $sort, $active]); flash('تمت إضافة الماركة'); }
    } elseif ($action === 'delete' && $id) {
        q('DELETE FROM brands WHERE id = ?', [$id]);
        flash('تم حذف الماركة');
    }
    redirect_admin('brands.php');
}
$edit = isset($_GET['edit']) ? qone('SELECT * FROM brands WHERE id = ?', [(int)$_GET['edit']]) : null;
$brands = qall('SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id) AS products_count FROM brands b ORDER BY b.sort_order, b.name');
admin_header('الماركات', 'brands.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">الماركات</h1>
<?php admin_msg(); ?>
<div class="mt-6 grid gap-5 lg:grid-cols-3">
  <div class="admin-card h-fit p-6">
    <h2 class="font-extrabold"><?= $edit ? 'تعديل ماركة' : 'ماركة جديدة' ?></h2>
    <form method="post" enctype="multipart/form-data" class="mt-4 space-y-3">
      <input type="hidden" name="action" value="save"><input type="hidden" name="id" value="<?= (int)($edit['id'] ?? 0) ?>">
      <label class="block text-sm font-bold">الاسم<input name="name" required value="<?= e($edit['name'] ?? '') ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">الرابط (slug)<input name="slug" dir="ltr" value="<?= e($edit['slug'] ?? '') ?>" class="admin-input mt-1 text-left" placeholder="تلقائي"></label>
      <label class="block text-sm font-bold">رابط الشعار<input name="image" dir="ltr" value="<?= e($edit['image'] ?? '') ?>" class="admin-input mt-1 text-left"></label>
      <label class="block text-sm font-bold">أو رفع<input type="file" name="image_file" accept="image/*" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">الترتيب<input name="sort_order" type="number" value="<?= e((string)($edit['sort_order'] ?? 0)) ?>" class="admin-input mt-1"></label>
      <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="active" <?= ($edit['active'] ?? 1) ? 'checked' : '' ?> class="h-4 w-4"> ظاهر</label>
      <button class="admin-btn w-full justify-center"><?= icon('check', 16) ?> حفظ</button>
      <?php if ($edit): ?><a href="<?= e(admin_url('brands.php')) ?>" class="admin-btn-ghost w-full justify-center">إلغاء التعديل</a><?php endif; ?>
    </form>
  </div>
  <div class="admin-card overflow-x-auto lg:col-span-2">
    <table class="admin-table w-full">
      <thead><tr><th>الماركة</th><th>المنتجات</th><th>الترتيب</th><th>ظاهر</th><th></th></tr></thead>
      <tbody>
      <?php foreach ($brands as $b): ?>
        <tr class="<?= $b['active'] ? '' : 'opacity-50' ?>">
          <td><div class="flex items-center gap-3"><?php if ($b['image']): ?><img src="<?= e(img_url($b['image'])) ?>" class="h-9 w-9 rounded-xl object-cover" alt=""><?php endif; ?><b><?= e($b['name']) ?></b></div></td>
          <td><?= (int)$b['products_count'] ?></td>
          <td><?= (int)$b['sort_order'] ?></td>
          <td><?= $b['active'] ? '✓' : '—' ?></td>
          <td class="whitespace-nowrap">
            <a href="<?= e(admin_url('brands.php?edit=' . (int)$b['id'])) ?>" class="mr-2 inline-block text-neutral-500 hover:text-violet-700"><?= icon('edit', 17) ?></a>
            <form method="post" class="inline" onsubmit="return confirm('حذف الماركة؟ المنتجات المرتبطة تبقى بدون ماركة')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$b['id'] ?>"><button class="text-neutral-400 hover:text-red-600"><?= icon('trash', 17) ?></button></form>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>
<?php admin_footer(); ?>
