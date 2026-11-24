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
    } elseif ($action === 'move' && $id) {
        $dir = ($_POST['dir'] ?? '') === 'up' ? -1 : 1;
        $ids = array_column(qall('SELECT id FROM banners ORDER BY sort_order, id'), 'id');
        $i = array_search($id, array_map('intval', $ids));
        $j = ($i === false) ? -1 : $i + $dir;
        if ($i !== false && isset($ids[$j])) {
            [$ids[$i], $ids[$j]] = [$ids[$j], $ids[$i]];
            foreach ($ids as $pos => $bid) q('UPDATE banners SET sort_order = ? WHERE id = ?', [$pos + 1, $bid]);
            flash('تم تغيير الترتيب');
        }
    } elseif ($action === 'toggle' && $id) {
        q('UPDATE banners SET active = 1 - active WHERE id = ?', [$id]);
        flash('تم تغيير حالة الظهور');
    }
    redirect_admin('banners.php');
}
$edit = isset($_GET['edit']) ? qone('SELECT * FROM banners WHERE id = ?', [(int)$_GET['edit']]) : null;
$banners = qall('SELECT * FROM banners ORDER BY sort_order, id');
admin_header('البنرات الترويجية', 'banners.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">البنرات الترويجية</h1>
<p class="mt-1 text-sm text-neutral-500">تظهر أول 3 بنرات مفعّلة فقط في الصفحة الرئيسية حسب الترتيب</p>
<?php admin_msg(); ?>
<div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
  <div id="editor-card" class="order-2 admin-card h-fit <?=!$edit?'hidden':''?> p-6">
    <h2 class="font-extrabold"><?= $edit ? 'تعديل بنر' : 'بنر جديد' ?></h2>
    <form method="post" enctype="multipart/form-data" class="mt-4 space-y-3">
      <input type="hidden" name="action" value="save"><input type="hidden" name="id" value="<?= (int)($edit['id'] ?? 0) ?>">
      <label class="block text-sm font-bold">العنوان<input name="title" value="<?= e($edit['title'] ?? '') ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">النص الفرعي<textarea name="subtitle" rows="2" class="admin-input mt-1 resize-none"><?= e($edit['subtitle'] ?? '') ?></textarea></label>
      <label class="block text-sm font-bold">الرابط<input name="link" dir="ltr" value="<?= e($edit['link'] ?? '') ?>" class="admin-input mt-1 text-left" placeholder="products.php"></label>
      <div data-image-picker><span class="text-sm font-bold">صورة البنر</span><div class="mt-1.5 flex items-center gap-3"><div class="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200" hidden><img alt="" class="h-full w-full object-cover"><button type="button" data-remove aria-label="إزالة" class="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"><?=icon('x',12)?></button></div><label class="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-neutral-50"><?=icon('upload',16)?> رفع صورة<input type="file" accept="image/*" class="hidden"></label></div><input name="image" dir="ltr" value="<?=e($edit['image']??'')?>" placeholder="/images/example.jpg أو رابط خارجي" class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-left text-xs text-neutral-500"><p role="status" class="mt-2 text-xs text-red-600"></p></div>
      <label class="block text-sm font-bold">الترتيب<input name="sort_order" type="number" value="<?= e((string)($edit['sort_order'] ?? 0)) ?>" class="admin-input mt-1"></label>
      <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="active" <?= ($edit['active'] ?? 1) ? 'checked' : '' ?> class="h-4 w-4"> ظاهر</label>
      <button class="admin-btn w-full justify-center"><?= icon('check', 16) ?> حفظ</button>
      <?php if ($edit): ?><a href="<?= e(admin_url('banners.php')) ?>" class="admin-btn-ghost w-full justify-center">إلغاء</a><?php endif; ?>
    </form>
  </div>
  <div class="order-1 min-w-0 space-y-4 lg:col-span-2">
    <?php foreach ($banners as $bi => $b): ?>
      <div class="admin-card flex items-center gap-4 p-4 <?= $b['active'] ? '' : 'opacity-50' ?>">
        <div class="flex flex-col">
          <form method="post"><input type="hidden" name="action" value="move"><input type="hidden" name="dir" value="up"><input type="hidden" name="id" value="<?= (int)$b['id'] ?>"><button <?= $bi === 0 ? 'disabled' : '' ?> class="grid h-6 w-6 place-items-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-black disabled:opacity-30" aria-label="أعلى"><?= icon('chevron-up', 15) ?></button></form>
          <form method="post"><input type="hidden" name="action" value="move"><input type="hidden" name="dir" value="down"><input type="hidden" name="id" value="<?= (int)$b['id'] ?>"><button <?= $bi === count($banners) - 1 ? 'disabled' : '' ?> class="grid h-6 w-6 place-items-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-black disabled:opacity-30" aria-label="أسفل"><?= icon('chevron-down', 15) ?></button></form>
        </div>
        <?php if ($b['image']): ?><img src="<?= e(img_url($b['image'])) ?>" class="h-20 w-28 shrink-0 rounded-2xl bg-neutral-100 object-cover" alt=""><?php else: ?><span class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-neutral-900 text-white"><?= icon('badge-percent', 22) ?></span><?php endif; ?>
        <div class="min-w-0 flex-1">
          <p class="font-extrabold"><?= e($b['title'] ?: '—') ?></p>
          <p class="text-xs text-neutral-400"><?= e($b['subtitle']) ?> <?= $b['active'] ? '' : ' <span class="font-bold text-red-400">(مخفي)</span>' ?></p>
        </div>
        <form method="post"><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= (int)$b['id'] ?>"><button class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white" title="<?= $b['active'] ? 'إخفاء' : 'إظهار' ?>" aria-label="<?= $b['active'] ? 'إخفاء' : 'إظهار' ?>"><?= icon($b['active'] ? 'eye' : 'eye-off', 15) ?></button></form>
        <a href="<?= e(admin_url('banners.php?edit=' . (int)$b['id'])) ?>" class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white"><?= icon('edit', 15) ?></a>
        <form method="post" onsubmit="return confirm('حذف البنر؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$b['id'] ?>"><button class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-600 hover:text-white"><?= icon('trash', 15) ?></button></form>
      </div>
    <?php endforeach; ?>
    <?php if (count($banners) > 3): ?><p class="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">لديك <?= count($banners) ?> بنرات — الواجهة تعرض أول 3 مفعّلة فقط.</p><?php endif; ?>
    <?php if (!$banners): ?><div class="admin-card py-16 text-center text-neutral-400">لا توجد بنرات</div><?php endif; ?>
<button type="button" id="new-item" class="flex items-center gap-2 rounded-full bg-black px-6 py-3 font-bold text-white transition hover:bg-neutral-800"><?=icon('plus',18)?> بنر جديد</button>
  </div>
</div>

<?php admin_footer(); ?>

<script>document.getElementById('new-item').onclick=()=>{let f=document.getElementById('editor-card');f.classList.remove('hidden');f.scrollIntoView({behavior:'smooth',block:'nearest'});};</script>

<script src="<?=e(url('assets/image-picker.js'))?>"></script>
