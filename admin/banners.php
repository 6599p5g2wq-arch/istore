<?php
require_once __DIR__ . '/_init.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $id = (int)($_POST['id'] ?? 0);
    if ($action === 'save') {
        $title = mb_substr(trim($_POST['title'] ?? ''), 0, 300);
        $subtitle = trim($_POST['subtitle'] ?? '');
        $link = trim($_POST['link'] ?? '') ?: 'products.php';
        $image = trim($_POST['image'] ?? '');
        $up = handle_image_upload('image_file'); if ($up) $image = $up;
        $sort = (int)($_POST['sort_order'] ?? 0);
        $active = !empty($_POST['active']) ? 1 : 0;
        if ($id) { q('UPDATE banners SET title=?, subtitle=?, image=?, link=?, sort_order=?, active=? WHERE id=?', [$title, $subtitle, $image, $link, $sort, $active, $id]); flash('تم حفظ البنر'); }
        else { q('INSERT INTO banners (title, subtitle, image, link, sort_order, active) VALUES (?, ?, ?, ?, ?, ?)', [$title, $subtitle, $image, $link, $sort, $active]); flash('تمت إضافة البنر'); }
    } elseif ($action === 'delete' && $id) {
        q('DELETE FROM banners WHERE id = ?', [$id]);
        flash('تم حذف البنر');
    }
    redirect_admin('banners.php');
}
$edit = isset($_GET['edit']) ? qone('SELECT * FROM banners WHERE id = ?', [(int)$_GET['edit']]) : null;
$banners = qall('SELECT * FROM banners ORDER BY sort_order, id');
admin_header('البنرات الترويجية', 'banners.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">البنرات الترويجية</h1>
<?php admin_msg(); ?>
<div class="mt-6 grid gap-5 lg:grid-cols-3">
  <div class="admin-card h-fit p-6">
    <h2 class="font-extrabold"><?= $edit ? 'تعديل بنر' : 'بنر جديد' ?></h2>
    <form method="post" enctype="multipart/form-data" class="mt-4 space-y-3">
      <input type="hidden" name="action" value="save"><input type="hidden" name="id" value="<?= (int)($edit['id'] ?? 0) ?>">
      <label class="block text-sm font-bold">العنوان<input name="title" value="<?= e($edit['title'] ?? '') ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">النص الفرعي<textarea name="subtitle" rows="2" class="admin-input mt-1 resize-none"><?= e($edit['subtitle'] ?? '') ?></textarea></label>
      <label class="block text-sm font-bold">الرابط<input name="link" dir="ltr" value="<?= e($edit['link'] ?? '') ?>" class="admin-input mt-1 text-left" placeholder="products.php"></label>
      <label class="block text-sm font-bold">رابط الصورة<input name="image" dir="ltr" value="<?= e($edit['image'] ?? '') ?>" class="admin-input mt-1 text-left"></label>
      <label class="block text-sm font-bold">أو رفع<input type="file" name="image_file" accept="image/*" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">الترتيب<input name="sort_order" type="number" value="<?= e((string)($edit['sort_order'] ?? 0)) ?>" class="admin-input mt-1"></label>
      <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="active" <?= ($edit['active'] ?? 1) ? 'checked' : '' ?> class="h-4 w-4"> ظاهر</label>
      <button class="admin-btn w-full justify-center"><?= icon('check', 16) ?> حفظ</button>
      <?php if ($edit): ?><a href="<?= e(admin_url('banners.php')) ?>" class="admin-btn-ghost w-full justify-center">إلغاء</a><?php endif; ?>
    </form>
  </div>
  <div class="space-y-3 lg:col-span-2">
    <?php foreach ($banners as $b): ?>
      <div class="admin-card flex items-center gap-4 p-4 <?= $b['active'] ? '' : 'opacity-50' ?>">
        <?php if ($b['image']): ?><img src="<?= e(img_url($b['image'])) ?>" class="h-16 w-24 rounded-xl object-cover" alt=""><?php endif; ?>
        <div class="min-w-0 flex-1">
          <b class="block truncate"><?= e($b['title'] ?: '—') ?></b>
          <p class="truncate text-sm text-neutral-500"><?= e($b['subtitle']) ?></p>
        </div>
        <a href="<?= e(admin_url('banners.php?edit=' . (int)$b['id'])) ?>" class="text-neutral-500 hover:text-violet-700"><?= icon('edit', 18) ?></a>
        <form method="post" onsubmit="return confirm('حذف البنر؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$b['id'] ?>"><button class="text-neutral-400 hover:text-red-600"><?= icon('trash', 18) ?></button></form>
      </div>
    <?php endforeach; ?>
    <?php if (!$banners): ?><div class="admin-card py-16 text-center text-neutral-400">لا توجد بنرات</div><?php endif; ?>
  </div>
</div>
<?php admin_footer(); ?>
