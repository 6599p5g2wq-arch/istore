<?php
require_once __DIR__ . '/_init.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $id = (int)($_POST['id'] ?? 0);
    if ($action === 'save') {
        $name = mb_substr(trim($_POST['name'] ?? ''), 0, 200);
        $slug = trim($_POST['slug'] ?? '') ?: trim(preg_replace('/[^\p{L}\p{N}]+/u', '-', $name), '-');
        $description = trim($_POST['description'] ?? '');
        $image = trim($_POST['image'] ?? '');
        $up = handle_image_upload('image_file'); if ($up) $image = $up;
        $sort = (int)($_POST['sort_order'] ?? 0);
        $active = !empty($_POST['active']) ? 1 : 0;
        if (!$name) { flash('الاسم مطلوب', true); redirect_admin('categories.php' . ($id ? '?edit=' . $id : '')); }
        $dup = qone('SELECT id FROM categories WHERE slug = ? AND id != ?', [$slug, $id]);
        if ($dup) $slug .= '-' . substr(bin2hex(random_bytes(2)), 0, 4);
        if ($id) { q('UPDATE categories SET name=?, slug=?, description=?, image=?, sort_order=?, active=? WHERE id=?', [$name, $slug, $description, $image, $sort, $active, $id]); flash('تم حفظ التصنيف'); }
        else { q('INSERT INTO categories (name, slug, description, image, sort_order, active) VALUES (?, ?, ?, ?, ?, ?)', [$name, $slug, $description, $image, $sort, $active]); flash('تمت إضافة التصنيف'); }
    } elseif ($action === 'toggle' && $id) {
        q('UPDATE categories SET active = 1 - active WHERE id = ?', [$id]);
        flash('تم تحديث الظهور');
    } elseif ($action === 'move' && $id) {
        $dir = ($_POST['dir'] ?? '') === 'up' ? -1 : 1;
        $rows = qall('SELECT id FROM categories ORDER BY sort_order, id');
        $ids = array_map(fn($r) => (int)$r['id'], $rows);
        $i = array_search($id, $ids, true);
        $j = $i === false ? -1 : $i + $dir;
        if ($i !== false && $j >= 0 && $j < count($ids)) {
            foreach ($ids as $k => $cid) q('UPDATE categories SET sort_order = ? WHERE id = ?', [($k + 1) * 10, $cid]);
            [$ids[$i], $ids[$j]] = [$ids[$j], $ids[$i]];
            q('UPDATE categories SET sort_order = ? WHERE id = ?', [($j + 1) * 10, $ids[$j]]);
            q('UPDATE categories SET sort_order = ? WHERE id = ?', [($i + 1) * 10, $ids[$i]]);
            flash('تم تغيير الترتيب');
        }
    } elseif ($action === 'delete' && $id) {
        $used = (int)(qone('SELECT COUNT(*) c FROM products WHERE category_id = ?', [$id])['c'] ?? 0);
        if ($used > 0) {
            $re = (int)($_POST['reassign'] ?? 0);
            if ($re > 0 && qone('SELECT id FROM categories WHERE id = ? AND id != ?', [$re, $id])) {
                q('UPDATE products SET category_id = ? WHERE category_id = ?', [$re, $id]);
            } else {
                q('UPDATE products SET category_id = NULL WHERE category_id = ?', [$id]);
            }
        }
        q('DELETE FROM categories WHERE id = ?', [$id]);
        flash('تم حذف التصنيف' . ($used ? ' ونقل منتجاته' : ''));
    }
    redirect_admin('categories.php');
}
$edit = isset($_GET['edit']) ? qone('SELECT * FROM categories WHERE id = ?', [(int)$_GET['edit']]) : null;
$cats = qall('SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS products_count FROM categories c ORDER BY c.sort_order, c.id');
admin_header('التصنيفات', 'categories.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">التصنيفات</h1>
<?php admin_msg(); ?>
<div class="mt-6 grid gap-6 lg:grid-cols-3"><div class="lg:col-span-2"><div class="grid gap-4 sm:grid-cols-2">
<?php foreach ($cats as $i=>$c): ?>
<div class="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm <?= $c['active']?'':'opacity-60' ?>">
<?php if ($c['image']): ?><img src="<?=e(img_url($c['image']))?>" alt="" class="h-16 w-16 shrink-0 rounded-2xl bg-neutral-100 object-cover"><?php else: ?><span class="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-400"><?=icon('tag',22)?></span><?php endif; ?>
<div class="min-w-0 flex-1"><p class="font-extrabold"><?=e($c['name'])?></p><a href="<?=e(admin_url('products.php?cat='.(int)$c['id']))?>" class="text-xs font-bold text-violet-700 hover:underline"><?=(int)$c['products_count']?> منتج</a><?php if(!$c['active']): ?><span class="ms-2 text-xs font-bold text-red-400">مخفي</span><?php endif; ?>
<div class="mt-1.5 flex items-center gap-1.5">
<?php foreach(['up','down'] as $dir): ?><form method="post"><input type="hidden" name="action" value="move"><input type="hidden" name="id" value="<?=(int)$c['id']?>"><input type="hidden" name="dir" value="<?=$dir?>"><button aria-label="<?=$dir==='up'?'رفع':'خفض'?>" <?=($dir==='up'&&$i===0)||($dir==='down'&&$i===count($cats)-1)?'disabled':''?> class="grid h-7 w-7 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white disabled:opacity-30"><?=icon($dir==='up'?'arrow-up':'arrow-down',13)?></button></form><?php endforeach; ?>
<form method="post"><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?=(int)$c['id']?>"><button aria-label="<?=$c['active']?'إخفاء':'إظهار'?>" class="relative h-5 w-9 rounded-full transition <?=$c['active']?'bg-emerald-500':'bg-neutral-300'?>"><span class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all" style="inset-inline-start:<?=$c['active']?'calc(100% - 18px)':'2px'?>"></span></button></form></div></div>
<a href="<?=e(admin_url('categories.php?edit='.(int)$c['id']))?>" aria-label="تعديل" class="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white"><?=icon('edit',15)?></a>
<button type="button" aria-label="حذف" class="js-cat-del grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-red-600 hover:text-white" data-id="<?=(int)$c['id']?>" data-name="<?=e($c['name'])?>" data-count="<?=(int)$c['products_count']?>"><?=icon('trash',15)?></button>
</div><?php endforeach; ?></div><button type="button" id="taxonomy-new" class="mt-5 flex items-center gap-2 rounded-full bg-black px-6 py-3 font-bold text-white transition hover:bg-neutral-800"><?=icon('plus',18)?> تصنيف جديد</button></div>
    <form method="post" enctype="multipart/form-data" id="taxonomy-form" class="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-8 <?=!$edit?'hidden':''?>">
      <div class="flex items-center justify-between"><h2 class="font-extrabold"><?=$edit?'تعديل: '.e($edit['name']):'تصنيف جديد'?></h2><a href="categories.php" aria-label="إغلاق"><?=icon('x',18)?></a></div><input type="hidden" name="action" value="save"><input type="hidden" name="id" value="<?= (int)($edit['id'] ?? 0) ?>">
      <label class="block text-sm font-bold">الاسم<input id="cat-name" name="name" required value="<?= e($edit['name'] ?? '') ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">الرابط (slug)<input id="cat-slug" name="slug" dir="ltr" value="<?= e($edit['slug'] ?? '') ?>" class="admin-input mt-1 text-left" placeholder="تلقائي"></label>
      <label class="block text-sm font-bold">الوصف<textarea name="description" rows="2" class="admin-input mt-1 resize-none"><?= e($edit['description'] ?? '') ?></textarea></label>
      <div data-image-picker><span class="text-sm font-bold">صورة التصنيف</span><div class="mt-1.5 flex items-center gap-3"><div class="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200" hidden><img alt="" class="h-full w-full object-cover"><button type="button" data-remove aria-label="إزالة" class="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"><?=icon('x',12)?></button></div><label class="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-neutral-50"><?=icon('upload',16)?> رفع صورة<input type="file" accept="image/*" class="hidden"></label></div><input name="image" dir="ltr" value="<?=e($edit['image']??'')?>" placeholder="/images/example.jpg أو رابط خارجي" class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-left text-xs text-neutral-500"><p role="status" class="mt-2 text-xs text-red-600"></p></div>
      <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="active" <?= ($edit['active'] ?? 1) ? 'checked' : '' ?> class="h-4 w-4"> ظاهر</label>
      <button class="admin-btn w-full justify-center"><?= icon('check', 16) ?> حفظ</button>
      <?php if ($edit): ?><a href="<?= e(admin_url('categories.php')) ?>" class="admin-btn-ghost w-full justify-center">إلغاء التعديل</a><?php endif; ?>
    </form>
</div>

<div id="cat-del-modal" class="fixed inset-0 z-50 hidden place-items-center bg-black/50 p-4">
  <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
    <h2 class="font-extrabold">حذف «<span id="cat-del-name"></span>»</h2>
    <form method="post" id="cat-del-form">
      <input type="hidden" name="action" value="delete"><input type="hidden" name="id" id="cat-del-id" value="">
      <p class="mt-3 text-sm text-neutral-600" id="cat-del-msg"></p>
      <div id="cat-del-reassign-wrap" class="mt-3 hidden">
        <select name="reassign" class="admin-input w-full">
          <option value="0">بدون تصنيف</option>
          <?php foreach ($cats as $c): ?><option value="<?= (int)$c['id'] ?>" class="js-cat-opt">نقل إلى: <?= e($c['name']) ?></option><?php endforeach; ?>
        </select>
      </div>
      <div class="mt-5 flex gap-2">
        <button class="admin-btn flex-1 justify-center !bg-red-600"><?= icon('trash', 16) ?> حذف التصنيف</button>
        <button type="button" id="cat-del-cancel" class="admin-btn-ghost px-6">إلغاء</button>
      </div>
    </form>
  </div>
</div>

<script>
(function(){
  // slug تلقائي من الاسم حتى يُعدّل يدوياً
  var name = document.getElementById('cat-name'), slug = document.getElementById('cat-slug');
  var touched = slug.value !== '';
  slug.addEventListener('input', function(){ touched = true; });
  name.addEventListener('input', function(){
    if (touched) return;
    slug.value = name.value.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
  });

  // نافذة الحذف الآمن
  var modal = document.getElementById('cat-del-modal');
  document.querySelectorAll('.js-cat-del').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.dataset.id, count = parseInt(btn.dataset.count || '0', 10);
      document.getElementById('cat-del-id').value = id;
      document.getElementById('cat-del-name').textContent = btn.dataset.name;
      var msg = document.getElementById('cat-del-msg');
      var wrap = document.getElementById('cat-del-reassign-wrap');
      if (count > 0) {
        msg.innerHTML = 'هذا التصنيف مرتبط بـ <b>' + count + '</b> منتج. ماذا نفعل بها؟';
        wrap.classList.remove('hidden');
        wrap.querySelectorAll('.js-cat-opt').forEach(function(o){ o.disabled = (o.value === id); });
      } else {
        msg.textContent = 'لا توجد منتجات مرتبطة بهذا التصنيف.';
        wrap.classList.add('hidden');
      }
      modal.classList.remove('hidden');
      modal.classList.add('grid');
    });
  });
  function closeModal(){ modal.classList.add('hidden'); modal.classList.remove('grid'); }
  document.getElementById('cat-del-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
})();
</script>
<?php admin_footer(); ?>

<script>document.getElementById('taxonomy-new').onclick=()=>{document.getElementById('taxonomy-form').classList.remove('hidden');document.getElementById('taxonomy-form').scrollIntoView({behavior:'smooth',block:'nearest'});};</script>

<script src="<?=e(url('assets/image-picker.js'))?>"></script>
