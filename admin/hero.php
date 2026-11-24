<?php
require_once __DIR__ . '/_init.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $id = (int)($_POST['id'] ?? 0);
    if ($action === 'save') {
        $title = mb_substr(trim($_POST['title'] ?? ''), 0, 300);
        if ($title === '') { flash('العنوان مطلوب', true); redirect_admin('hero.php' . ($id ? '?edit=' . $id : '')); }
        $subtitle = trim($_POST['subtitle'] ?? '');
        $ctaText = mb_substr(trim($_POST['cta_text'] ?? ''), 0, 100) ?: 'تسوق الآن';
        $ctaLink = trim($_POST['cta_link'] ?? '') ?: 'products.php';
        $image = trim($_POST['image'] ?? '');
        $up = handle_image_upload('image_file'); if ($up) $image = $up;
        // النمط محفوظ كما هو في القاعدة (لا يُعدَّل من هنا)
        $theme = 'dark';
        if ($id) { $row = qone('SELECT theme FROM hero_slides WHERE id = ?', [$id]); $theme = $row['theme'] ?? 'dark'; }
        $sort = (int)($_POST['sort_order'] ?? 0);
        $active = !empty($_POST['active']) ? 1 : 0;
        if ($id) { q('UPDATE hero_slides SET title=?, subtitle=?, cta_text=?, cta_link=?, image=?, theme=?, sort_order=?, active=? WHERE id=?', [$title, $subtitle, $ctaText, $ctaLink, $image, $theme, $sort, $active, $id]); flash('تم حفظ الشريحة'); }
        else { q('INSERT INTO hero_slides (title, subtitle, cta_text, cta_link, image, theme, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [$title, $subtitle, $ctaText, $ctaLink, $image, $theme, $sort, $active]); flash('تمت إضافة الشريحة'); }
    } elseif ($action === 'toggle' && $id) {
        q('UPDATE hero_slides SET active = 1 - active WHERE id = ?', [$id]);
        flash('تم تبديل الظهور');
    } elseif (($action === 'move') && $id) {
        $dir = ($_POST['dir'] ?? '') === 'down' ? 'down' : 'up';
        $ids = array_map(fn($r) => (int)$r['id'], qall('SELECT id FROM hero_slides ORDER BY sort_order, id'));
        $i = array_search($id, $ids, true);
        if ($i !== false) {
            $j = $dir === 'up' ? $i - 1 : $i + 1;
            if ($j >= 0 && $j < count($ids)) {
                // إعادة ترقيم متسلسلة ثم تبديل الجارين
                foreach ($ids as $k => $sid) q('UPDATE hero_slides SET sort_order = ? WHERE id = ?', [($k + 1) * 10, $sid]);
                [$ids[$i], $ids[$j]] = [$ids[$j], $ids[$i]];
                q('UPDATE hero_slides SET sort_order = ? WHERE id = ?', [($j + 1) * 10, $ids[$j]]);
                q('UPDATE hero_slides SET sort_order = ? WHERE id = ?', [($i + 1) * 10, $ids[$i]]);
            }
        }
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
<h1 class="text-2xl font-black sm:text-3xl">شرائح الصفحة الرئيسية</h1>
<p class="mt-1 text-sm text-neutral-500">السلايدر الكبير أعلى الصفحة الرئيسية — عدّل العناوين والصور والأزرار</p>
<?php admin_msg(); ?>
<div class="mt-6 grid gap-6 lg:grid-cols-3">
  <div id="editor-card" class="order-2 admin-card h-fit <?=!$edit?'hidden':''?> min-w-0 p-6 lg:sticky lg:top-8">
    <div class="flex items-center justify-between"><h2 class="font-extrabold"><?= $edit ? 'تعديل الشريحة' : 'شريحة جديدة' ?></h2><button type="button" id="close-editor" aria-label="إغلاق"><?=icon('x',18)?></button></div>
    <form method="post" enctype="multipart/form-data" class="mt-4 space-y-4">
      <input type="hidden" name="action" value="save"><input type="hidden" name="id" value="<?= (int)($edit['id'] ?? 0) ?>">
      <label class="block text-sm font-bold">العنوان *<textarea name="title" rows="2" required class="admin-input mt-1 resize-none"><?= e($edit['title'] ?? '') ?></textarea></label>
      <label class="block text-sm font-bold">النص الفرعي<textarea name="subtitle" rows="2" class="admin-input mt-1 resize-none"><?= e($edit['subtitle'] ?? '') ?></textarea></label>
<div class="grid grid-cols-2 gap-3">      <label class="block text-sm font-bold">نص الزر<input name="cta_text" value="<?= e($edit['cta_text'] ?? 'تسوق الآن') ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">رابط الزر<input name="cta_link" dir="ltr" list="hero-link-presets" value="<?= e($edit['cta_link'] ?? '') ?>" class="admin-input mt-1 text-left" placeholder="products.php"></label>
</div>      <datalist id="hero-link-presets">
        <option value="products.php"></option><option value="brands.php"></option><option value="about.php"></option><option value="track.php"></option><option value="wishlist.php"></option>
      </datalist>
      <label class="block text-sm font-bold">الترتيب<input name="sort_order" type="number" value="<?= e((string)($edit['sort_order'] ?? 99)) ?>" class="admin-input mt-1"></label>
      <div data-image-picker><span class="text-sm font-bold">صورة الشريحة</span><div class="mt-1.5 flex items-center gap-3"><div class="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200" hidden><img alt="" class="h-full w-full object-cover"><button type="button" data-remove aria-label="إزالة" class="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"><?=icon('x',12)?></button></div><label class="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-neutral-50"><?=icon('upload',16)?> رفع صورة<input type="file" accept="image/*" class="hidden"></label></div><input name="image" dir="ltr" value="<?=e($edit['image']??'')?>" placeholder="/images/example.jpg أو رابط خارجي" class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-left text-xs text-neutral-500"><p role="status" class="mt-2 text-xs text-red-600"></p></div>

      <label class="flex cursor-pointer items-center justify-between text-sm font-bold">ظاهرة<input type="checkbox" name="active" <?= ($edit['active'] ?? 1) ? 'checked' : '' ?> class="h-5 w-5 accent-black"></label>
      <button class="admin-btn w-full justify-center"><?= icon('save', 16) ?> حفظ</button>
      <?php if ($edit): ?><a href="<?= e(admin_url('hero.php')) ?>" class="admin-btn-ghost w-full justify-center">إلغاء</a><?php endif; ?>
    </form>
  </div>
  <div class="order-1 min-w-0 space-y-4 lg:col-span-2">
    <?php foreach ($slides as $idx => $s): ?>
      <div class="admin-card flex items-center gap-4 p-4 <?= $s['active'] ? '' : 'opacity-50' ?>">
        <?php if ($s['image']): ?><img src="<?= e(img_url($s['image'])) ?>" class="h-20 w-28 shrink-0 rounded-2xl bg-neutral-100 object-cover" alt=""><?php endif; ?>
        <div class="min-w-0 flex-1">
          <b class="block whitespace-pre-line leading-snug"><?= e($s['title'] ?: '— بدون عنوان —') ?></b>
          <p class="line-clamp-1 text-xs text-neutral-400"><?= e($s['subtitle']) ?></p>
          <p class="text-xs text-neutral-400" dir="ltr"><?=e($s['cta_text'])?> → <?=e($s['cta_link'])?></p>
        </div>
        <div class="flex shrink-0 flex-col gap-1">
          <form method="post"><input type="hidden" name="action" value="move"><input type="hidden" name="dir" value="up"><input type="hidden" name="id" value="<?= (int)$s['id'] ?>"><button <?=$idx===0?'disabled':''?> aria-label="رفع" class="disabled:opacity-30 grid h-7 w-7 place-items-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-violet-600 hover:text-white"><?= icon('chevron-up', 13) ?></button></form>
          <form method="post"><input type="hidden" name="action" value="move"><input type="hidden" name="dir" value="down"><input type="hidden" name="id" value="<?= (int)$s['id'] ?>"><button <?=$idx===count($slides)-1?'disabled':''?> aria-label="خفض" class="disabled:opacity-30 grid h-7 w-7 place-items-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-violet-600 hover:text-white"><?= icon('chevron-down', 13) ?></button></form>
        </div>
        <form method="post"><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= (int)$s['id'] ?>"><button aria-label="<?= $s['active'] ? 'إخفاء' : 'إظهار' ?>" title="<?= $s['active'] ? 'إخفاء' : 'إظهار' ?>" class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white"><?= icon($s['active'] ? 'eye' : 'eye-off', 18) ?></button></form>
        <a href="<?= e(admin_url('hero.php?edit=' . (int)$s['id'])) ?>" class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white"><?= icon('edit', 18) ?></a>
        <form method="post" onsubmit="return confirm('حذف الشريحة؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$s['id'] ?>"><button class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-600 hover:text-white"><?= icon('trash', 18) ?></button></form>
      </div>
    <?php endforeach; ?>
    <?php if (!$slides): ?><div class="admin-card py-16 text-center text-neutral-400">لا توجد شرائح بعد — أضف أول شريحة للصفحة الرئيسية</div><?php endif; ?>
<button type="button" id="new-item" class="flex items-center gap-2 rounded-full bg-black px-6 py-3 font-bold text-white transition hover:bg-neutral-800"><?=icon('plus',18)?> شريحة جديدة</button>
  </div>
</div>

<?php admin_footer(); ?>

<script>document.getElementById('close-editor').onclick=()=>document.getElementById('editor-card').classList.add('hidden');document.getElementById('new-item').onclick=()=>{let f=document.getElementById('editor-card');f.classList.remove('hidden');f.scrollIntoView({behavior:'smooth',block:'nearest'});};</script>

<script src="<?=e(url('assets/image-picker.js'))?>"></script>
