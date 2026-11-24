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
        if (!$name) { flash('الاسم مطلوب', true); redirect_admin('brands.php'); }
        $dup = qone('SELECT id FROM brands WHERE slug = ? AND id != ?', [$slug, $id]);
        if ($dup) $slug .= '-' . substr(bin2hex(random_bytes(2)), 0, 4);
        if ($id) { q('UPDATE brands SET name=?, slug=?, description=?, image=?, sort_order=?, active=? WHERE id=?', [$name, $slug, $description, $image, $sort, $active, $id]); flash('تم حفظ الماركة'); }
        else { q('INSERT INTO brands (name, slug, description, image, sort_order, active) VALUES (?, ?, ?, ?, ?, ?)', [$name, $slug, $description, $image, $sort, $active]); flash('تمت إضافة الماركة'); }
    } elseif ($action === 'toggle' && $id) {
        q('UPDATE brands SET active = 1 - active WHERE id = ?', [$id]);
        flash('تم تحديث الظهور');
    } elseif ($action === 'move' && $id) {
        $dir = ($_POST['dir'] ?? '') === 'up' ? -1 : 1;
        $rows = qall('SELECT id FROM brands ORDER BY sort_order, id');
        $ids = array_map(fn($r) => (int)$r['id'], $rows);
        $i = array_search($id, $ids, true);
        $j = $i === false ? -1 : $i + $dir;
        if ($i !== false && $j >= 0 && $j < count($ids)) {
            foreach ($ids as $k => $bid) q('UPDATE brands SET sort_order = ? WHERE id = ?', [($k + 1) * 10, $bid]);
            [$ids[$i], $ids[$j]] = [$ids[$j], $ids[$i]];
            q('UPDATE brands SET sort_order = ? WHERE id = ?', [($j + 1) * 10, $ids[$j]]);
            q('UPDATE brands SET sort_order = ? WHERE id = ?', [($i + 1) * 10, $ids[$i]]);
            flash('تم تغيير الترتيب');
        }
    } elseif ($action === 'delete' && $id) {
        $used = (int)(qone('SELECT COUNT(*) c FROM products WHERE brand_id = ?', [$id])['c'] ?? 0);
        if ($used > 0) {
            $re = (int)($_POST['reassign'] ?? 0);
            if ($re > 0 && qone('SELECT id FROM brands WHERE id = ? AND id != ?', [$re, $id])) {
                q('UPDATE products SET brand_id = ? WHERE brand_id = ?', [$re, $id]);
            } else {
                q('UPDATE products SET brand_id = NULL WHERE brand_id = ?', [$id]);
            }
        }
        q('DELETE FROM brands WHERE id = ?', [$id]);
        flash('تم حذف الماركة' . ($used ? ' ونقل منتجاتها' : ''));
    }
    redirect_admin('brands.php');
}
$edit = isset($_GET['edit']) ? qone('SELECT * FROM brands WHERE id = ?', [(int)$_GET['edit']]) : null;
$brands = qall('SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id) AS products_count FROM brands b ORDER BY b.sort_order, b.id');
admin_header('الماركات', 'brands.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">الماركات</h1>
<?php admin_msg(); ?>
<div class="mt-6 grid gap-6 lg:grid-cols-3"><div class="lg:col-span-2"><div class="grid gap-4 sm:grid-cols-2">
<?php foreach ($brands as $i=>$b): ?>
<div class="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm <?= $b['active']?'':'opacity-60' ?>">
<?php if ($b['image']): ?><img src="<?=e(img_url($b['image']))?>" alt="" class="h-16 w-16 shrink-0 rounded-2xl bg-neutral-100 object-cover"><?php else: ?><span class="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-400"><?=icon('tag',22)?></span><?php endif; ?>
<div class="min-w-0 flex-1"><p class="font-extrabold"><?=e($b['name'])?></p><a href="<?=e(admin_url('products.php?brand='.(int)$b['id']))?>" class="text-xs font-bold text-violet-700 hover:underline"><?=(int)$b['products_count']?> منتج</a><?php if(!$b['active']): ?><span class="ms-2 text-xs font-bold text-red-400">مخفي</span><?php endif; ?>
<div class="mt-1.5 flex items-center gap-1.5">
<?php foreach(['up','down'] as $dir): ?><form method="post"><input type="hidden" name="action" value="move"><input type="hidden" name="id" value="<?=(int)$b['id']?>"><input type="hidden" name="dir" value="<?=$dir?>"><button aria-label="<?=$dir==='up'?'رفع':'خفض'?>" <?=($dir==='up'&&$i===0)||($dir==='down'&&$i===count($brands)-1)?'disabled':''?> class="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white disabled:opacity-30"><?=icon($dir==='up'?'arrow-up':'arrow-down',13)?></button></form><?php endforeach; ?>
<form method="post"><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?=(int)$b['id']?>"><button aria-label="<?=$b['active']?'إخفاء':'إظهار'?>" class="relative h-5 w-9 rounded-full transition <?=$b['active']?'bg-emerald-500':'bg-neutral-300'?>"><span class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all" style="inset-inline-start:<?=$b['active']?'calc(100% - 18px)':'2px'?>"></span></button></form></div></div>
<a href="<?=e(admin_url('brands.php?edit='.(int)$b['id']))?>" aria-label="تعديل" class="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white"><?=icon('edit',15)?></a>
<button type="button" aria-label="حذف" class="js-brand-del grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-red-600 hover:text-white" data-id="<?=(int)$b['id']?>" data-name="<?=e($b['name'])?>" data-count="<?=(int)$b['products_count']?>"><?=icon('trash',15)?></button>
</div><?php endforeach; ?></div><button type="button" id="taxonomy-new" class="mt-5 flex items-center gap-2 rounded-full bg-black px-6 py-3 font-bold text-white transition hover:bg-neutral-800"><?=icon('plus',18)?> ماركة جديدة</button></div>
    <form method="post" enctype="multipart/form-data" id="taxonomy-form" class="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-8 <?=!$edit?'hidden':''?>">
      <div class="flex items-center justify-between"><h2 class="font-extrabold"><?=$edit?'تعديل: '.e($edit['name']):'ماركة جديدة'?></h2><a href="brands.php" aria-label="إغلاق"><?=icon('x',18)?></a></div><input type="hidden" name="action" value="save"><input type="hidden" name="id" value="<?= (int)($edit['id'] ?? 0) ?>">
      <label class="block text-sm font-bold">الاسم<input id="brand-name" name="name" required value="<?= e($edit['name'] ?? '') ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">الرابط (slug)<input id="brand-slug" name="slug" dir="ltr" value="<?= e($edit['slug'] ?? '') ?>" class="admin-input mt-1 text-left" placeholder="تلقائي"></label>
      <label class="block text-sm font-bold">الوصف<textarea name="description" rows="2" class="admin-input mt-1 resize-none"><?= e($edit['description'] ?? '') ?></textarea></label>
      <div data-image-picker><span class="text-sm font-bold">شعار الماركة</span><div class="mt-1.5 flex items-center gap-3"><div class="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200" hidden><img alt="" class="h-full w-full object-cover"><button type="button" data-remove aria-label="إزالة" class="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"><?=icon('x',12)?></button></div><label class="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-neutral-50"><?=icon('upload',16)?> رفع صورة<input type="file" accept="image/*" class="hidden"></label></div><input name="image" dir="ltr" value="<?=e($edit['image']??'')?>" placeholder="/images/example.jpg أو رابط خارجي" class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-left text-xs text-neutral-500"><p role="status" class="mt-2 text-xs text-red-600"></p></div>
      <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="active" <?= ($edit['active'] ?? 1) ? 'checked' : '' ?> class="h-4 w-4"> ظاهر</label>
      <button class="admin-btn w-full justify-center"><?= icon('check', 16) ?> حفظ</button>
      <?php if ($edit): ?><a href="<?= e(admin_url('brands.php')) ?>" class="admin-btn-ghost w-full justify-center">إلغاء التعديل</a><?php endif; ?>
    </form>
</div>

<div id="brand-del-modal" class="fixed inset-0 z-50 hidden place-items-center bg-black/50 p-4">
  <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
    <h2 class="font-extrabold">حذف «<span id="brand-del-name"></span>»</h2>
    <form method="post" id="brand-del-form">
      <input type="hidden" name="action" value="delete"><input type="hidden" name="id" id="brand-del-id" value="">
      <p class="mt-3 text-sm text-neutral-600" id="brand-del-msg"></p>
      <div id="brand-del-reassign-wrap" class="mt-3 hidden">
        <select name="reassign" class="admin-input w-full">
          <option value="0">بدون ماركة</option>
          <?php foreach ($brands as $b): ?><option value="<?= (int)$b['id'] ?>" class="js-brand-opt">نقل إلى: <?= e($b['name']) ?></option><?php endforeach; ?>
        </select>
      </div>
      <div class="mt-5 flex gap-2">
        <button class="admin-btn flex-1 justify-center !bg-red-600"><?= icon('trash', 16) ?> حذف الماركة</button>
        <button type="button" id="brand-del-cancel" class="admin-btn-ghost px-6">إلغاء</button>
      </div>
    </form>
  </div>
</div>

<script>
(function(){
  var name = document.getElementById('brand-name'), slug = document.getElementById('brand-slug');
  var touched = slug.value !== '';
  slug.addEventListener('input', function(){ touched = true; });
  name.addEventListener('input', function(){
    if (touched) return;
    slug.value = name.value.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
  });

  var modal = document.getElementById('brand-del-modal');
  document.querySelectorAll('.js-brand-del').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.dataset.id, count = parseInt(btn.dataset.count || '0', 10);
      document.getElementById('brand-del-id').value = id;
      document.getElementById('brand-del-name').textContent = btn.dataset.name;
      var msg = document.getElementById('brand-del-msg');
      var wrap = document.getElementById('brand-del-reassign-wrap');
      if (count > 0) {
        msg.innerHTML = 'هذه الماركة مرتبطة بـ <b>' + count + '</b> منتج. ماذا نفعل بها؟';
        wrap.classList.remove('hidden');
        wrap.querySelectorAll('.js-brand-opt').forEach(function(o){ o.disabled = (o.value === id); });
      } else {
        msg.textContent = 'لا توجد منتجات مرتبطة بهذه الماركة.';
        wrap.classList.add('hidden');
      }
      modal.classList.remove('hidden');
      modal.classList.add('grid');
    });
  });
  function closeModal(){ modal.classList.add('hidden'); modal.classList.remove('grid'); }
  document.getElementById('brand-del-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
})();
</script>
<?php admin_footer(); ?>

<script>document.getElementById('taxonomy-new').onclick=()=>{document.getElementById('taxonomy-form').classList.remove('hidden');document.getElementById('taxonomy-form').scrollIntoView({behavior:'smooth',block:'nearest'});};</script>

<script src="<?=e(url('assets/image-picker.js'))?>"></script>
