<?php
require_once __DIR__ . '/_init.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $id = (int)($_POST['id'] ?? 0);
    if ($action === 'save') {
        $title = mb_substr(trim($_POST['title'] ?? ''), 0, 300);
        $subtitle = trim($_POST['subtitle'] ?? '');
        $ctaText = mb_substr(trim($_POST['cta_text'] ?? ''), 0, 100) ?: 'تسوق الآن';
        $ctaLink = trim($_POST['cta_link'] ?? '') ?: 'products.php';
        $image = trim($_POST['image'] ?? '');
        $up = handle_image_upload('image_file'); if ($up) $image = $up;
        $theme = ($_POST['theme'] ?? 'dark') === 'light' ? 'light' : 'dark';
        $sort = (int)($_POST['sort_order'] ?? 0);
        $active = !empty($_POST['active']) ? 1 : 0;
        if ($id) { q('UPDATE hero_slides SET title=?, subtitle=?, cta_text=?, cta_link=?, image=?, theme=?, sort_order=?, active=? WHERE id=?', [$title, $subtitle, $ctaText, $ctaLink, $image, $theme, $sort, $active, $id]); flash('تم حفظ الشريحة'); }
        else { q('INSERT INTO hero_slides (title, subtitle, cta_text, cta_link, image, theme, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [$title, $subtitle, $ctaText, $ctaLink, $image, $theme, $sort, $active]); flash('تمت إضافة الشريحة'); }
    } elseif ($action === 'delete' && $id) {
        q('DELETE FROM hero_slides WHERE id = ?', [$id]);
        flash('تم حذف الشريحة');
    }
    redirect_admin('hero.php');
}
$edit = isset($_GET['edit']) ? qone('SELECT * FROM hero_slides WHERE id = ?', [(int)$_GET['edit']]) : null;
$slides = qall('SELECT * FROM hero_slides ORDER BY sort_order, id');
admin_header('شرائح الرئيسية', 'hero.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">شرائح الرئيسية</h1>
<p class="mt-1 text-sm text-neutral-500">شرائح العرض الرئيسي في أعلى الصفحة الرئيسية</p>
<?php admin_msg(); ?>
<div class="mt-6 grid gap-5 lg:grid-cols-3">
  <div class="admin-card h-fit p-6">
    <h2 class="font-extrabold"><?= $edit ? 'تعديل شريحة' : 'شريحة جديدة' ?></h2>
    <form method="post" enctype="multipart/form-data" class="mt-4 space-y-3">
      <input type="hidden" name="action" value="save"><input type="hidden" name="id" value="<?= (int)($edit['id'] ?? 0) ?>">
      <label class="block text-sm font-bold">العنوان<input name="title" value="<?= e($edit['title'] ?? '') ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">النص الفرعي<textarea name="subtitle" rows="2" class="admin-input mt-1 resize-none"><?= e($edit['subtitle'] ?? '') ?></textarea></label>
      <label class="block text-sm font-bold">نص الزر<input name="cta_text" value="<?= e($edit['cta_text'] ?? 'تسوق الآن') ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">رابط الزر<input name="cta_link" dir="ltr" value="<?= e($edit['cta_link'] ?? '') ?>" class="admin-input mt-1 text-left" placeholder="products.php"></label>
      <label class="block text-sm font-bold">رابط الصورة<input name="image" dir="ltr" value="<?= e($edit['image'] ?? '') ?>" class="admin-input mt-1 text-left"></label>
      <label class="block text-sm font-bold">أو رفع<input type="file" name="image_file" accept="image/*" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">النمط<select name="theme" class="admin-input mt-1"><option value="dark" <?= ($edit['theme'] ?? 'dark') === 'dark' ? 'selected' : '' ?>>داكن</option><option value="light" <?= ($edit['theme'] ?? '') === 'light' ? 'selected' : '' ?>>فاتح</option></select></label>
      <label class="block text-sm font-bold">الترتيب<input name="sort_order" type="number" value="<?= e((string)($edit['sort_order'] ?? 0)) ?>" class="admin-input mt-1"></label>
      <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="active" <?= ($edit['active'] ?? 1) ? 'checked' : '' ?> class="h-4 w-4"> ظاهر</label>
      <button class="admin-btn w-full justify-center"><?= icon('check', 16) ?> حفظ</button>
      <?php if ($edit): ?><a href="<?= e(admin_url('hero.php')) ?>" class="admin-btn-ghost w-full justify-center">إلغاء</a><?php endif; ?>
    </form>
  </div>
  <div class="space-y-3 lg:col-span-2">
    <?php foreach ($slides as $s): ?>
      <div class="admin-card flex items-center gap-4 p-4 <?= $s['active'] ? '' : 'opacity-50' ?>">
        <?php if ($s['image']): ?><img src="<?= e(img_url($s['image'])) ?>" class="h-16 w-24 rounded-xl object-cover" alt=""><?php endif; ?>
        <div class="min-w-0 flex-1">
          <b class="block truncate"><?= e($s['title'] ?: '— بدون عنوان —') ?></b>
          <p class="truncate text-sm text-neutral-500"><?= e($s['subtitle']) ?></p>
          <p class="text-xs text-neutral-400">ترتيب <?= (int)$s['sort_order'] ?> — <?= $s['theme'] === 'dark' ? 'داكن' : 'فاتح' ?> — <?= $s['active'] ? 'ظاهر' : 'مخفي' ?></p>
        </div>
        <a href="<?= e(admin_url('hero.php?edit=' . (int)$s['id'])) ?>" class="text-neutral-500 hover:text-violet-700"><?= icon('edit', 18) ?></a>
        <form method="post" onsubmit="return confirm('حذف الشريحة؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$s['id'] ?>"><button class="text-neutral-400 hover:text-red-600"><?= icon('trash', 18) ?></button></form>
      </div>
    <?php endforeach; ?>
    <?php if (!$slides): ?><div class="admin-card py-16 text-center text-neutral-400">لا توجد شرائح</div><?php endif; ?>
  </div>
</div>
<?php admin_footer(); ?>
