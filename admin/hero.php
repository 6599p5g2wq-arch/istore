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
<h1 class="text-2xl font-black sm:text-3xl">شرائح الرئيسية</h1>
<p class="mt-1 text-sm text-neutral-500">شرائح العرض الرئيسي في أعلى الصفحة الرئيسية</p>
<?php admin_msg(); ?>
<div class="mt-6 grid gap-5 lg:grid-cols-3">
  <div class="admin-card h-fit min-w-0 p-6">
    <h2 class="font-extrabold"><?= $edit ? 'تعديل شريحة' : 'شريحة جديدة' ?></h2>
    <form method="post" enctype="multipart/form-data" class="mt-4 space-y-3">
      <input type="hidden" name="action" value="save"><input type="hidden" name="id" value="<?= (int)($edit['id'] ?? 0) ?>">
      <label class="block text-sm font-bold">العنوان<textarea name="title" rows="2" required class="admin-input mt-1 resize-none"><?= e($edit['title'] ?? '') ?></textarea></label>
      <label class="block text-sm font-bold">النص الفرعي<textarea name="subtitle" rows="2" class="admin-input mt-1 resize-none"><?= e($edit['subtitle'] ?? '') ?></textarea></label>
      <label class="block text-sm font-bold">نص الزر<input name="cta_text" value="<?= e($edit['cta_text'] ?? 'تسوق الآن') ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">رابط الزر<input name="cta_link" dir="ltr" list="hero-link-presets" value="<?= e($edit['cta_link'] ?? '') ?>" class="admin-input mt-1 text-left" placeholder="products.php"></label>
      <datalist id="hero-link-presets">
        <option value="products.php"></option><option value="brands.php"></option><option value="about.php"></option><option value="track.php"></option><option value="wishlist.php"></option>
      </datalist>
      <label class="block text-sm font-bold">رابط الصورة<input name="image" id="hero-image-url" dir="ltr" value="<?= e($edit['image'] ?? '') ?>" class="admin-input mt-1 text-left"></label>
      <label class="block text-sm font-bold">أو رفع<input type="file" name="image_file" id="hero-image-file" accept="image/*" class="admin-input mt-1 w-full max-w-full"></label>
      <p class="-mt-1 text-xs text-neutral-400">المقاس الموصى به: صورة مربعة 800×800 بكسل أو أكبر بخلفية نظيفة</p>
      <div id="hero-image-preview" class="<?= !empty($edit['image']) ? '' : 'hidden' ?>">
        <img id="hero-image-preview-img" src="<?= !empty($edit['image']) ? e(img_url($edit['image'])) : '' ?>" class="h-24 w-24 rounded-2xl border border-neutral-200 object-cover" alt="">
      </div>
      <label class="block text-sm font-bold">الترتيب<input name="sort_order" type="number" value="<?= e((string)($edit['sort_order'] ?? 0)) ?>" class="admin-input mt-1"></label>
      <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="active" <?= ($edit['active'] ?? 1) ? 'checked' : '' ?> class="h-4 w-4"> ظاهر</label>
      <button class="admin-btn w-full justify-center"><?= icon('check', 16) ?> حفظ</button>
      <?php if ($edit): ?><a href="<?= e(admin_url('hero.php')) ?>" class="admin-btn-ghost w-full justify-center">إلغاء</a><?php endif; ?>
    </form>
  </div>
  <div class="min-w-0 space-y-3 lg:col-span-2">
    <?php foreach ($slides as $idx => $s): ?>
      <div class="admin-card flex items-center gap-4 p-4 <?= $s['active'] ? '' : 'opacity-50' ?>">
        <div class="flex shrink-0 flex-col gap-1">
          <?php if ($idx > 0): ?><form method="post"><input type="hidden" name="action" value="move"><input type="hidden" name="dir" value="up"><input type="hidden" name="id" value="<?= (int)$s['id'] ?>"><button aria-label="رفع" class="grid h-7 w-7 place-items-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-violet-600 hover:text-white"><?= icon('chevron-up', 13) ?></button></form><?php endif; ?>
          <?php if ($idx < count($slides) - 1): ?><form method="post"><input type="hidden" name="action" value="move"><input type="hidden" name="dir" value="down"><input type="hidden" name="id" value="<?= (int)$s['id'] ?>"><button aria-label="خفض" class="grid h-7 w-7 place-items-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-violet-600 hover:text-white"><?= icon('chevron-down', 13) ?></button></form><?php endif; ?>
        </div>
        <?php if ($s['image']): ?><img src="<?= e(img_url($s['image'])) ?>" class="h-16 w-24 rounded-xl object-cover" alt=""><?php endif; ?>
        <div class="min-w-0 flex-1">
          <b class="block truncate"><?= e($s['title'] ?: '— بدون عنوان —') ?></b>
          <p class="truncate text-sm text-neutral-500"><?= e($s['subtitle']) ?></p>
          <p class="text-xs text-neutral-400">ترتيب <?= (int)$s['sort_order'] ?> — <?= $s['active'] ? 'ظاهر' : 'مخفي' ?></p>
        </div>
        <form method="post"><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= (int)$s['id'] ?>"><button aria-label="<?= $s['active'] ? 'إخفاء' : 'إظهار' ?>" title="<?= $s['active'] ? 'إخفاء' : 'إظهار' ?>" class="text-neutral-500 hover:text-violet-700"><?= icon($s['active'] ? 'eye' : 'eye-off', 18) ?></button></form>
        <a href="<?= e(admin_url('hero.php?edit=' . (int)$s['id'])) ?>" class="text-neutral-500 hover:text-violet-700"><?= icon('edit', 18) ?></a>
        <form method="post" onsubmit="return confirm('حذف الشريحة؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$s['id'] ?>"><button class="text-neutral-400 hover:text-red-600"><?= icon('trash', 18) ?></button></form>
      </div>
    <?php endforeach; ?>
    <?php if (!$slides): ?><div class="admin-card py-16 text-center text-neutral-400">لا توجد شرائح بعد — أضف أول شريحة للصفحة الرئيسية</div><?php endif; ?>
  </div>
</div>
<script>
// معاينة فورية لصورة الشريحة قبل الحفظ (رابط أو ملف مرفوع)
(function () {
  var urlInput = document.getElementById('hero-image-url');
  var fileInput = document.getElementById('hero-image-file');
  var box = document.getElementById('hero-image-preview');
  var img = document.getElementById('hero-image-preview-img');
  function show(src) { if (src) { img.src = src; box.classList.remove('hidden'); } else { box.classList.add('hidden'); img.removeAttribute('src'); } }
  if (urlInput) urlInput.addEventListener('input', function () { show(urlInput.value.trim()); });
  if (fileInput) fileInput.addEventListener('change', function () { if (fileInput.files && fileInput.files[0]) show(URL.createObjectURL(fileInput.files[0])); });
})();
</script>
<?php admin_footer(); ?>
