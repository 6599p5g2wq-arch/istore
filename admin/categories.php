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
<div class="mt-6 grid gap-5 lg:grid-cols-3">
  <div class="admin-card h-fit p-6">
    <h2 class="font-extrabold"><?= $edit ? 'تعديل تصنيف' : 'تصنيف جديد' ?></h2>
    <form method="post" enctype="multipart/form-data" class="mt-4 space-y-3">
      <input type="hidden" name="action" value="save"><input type="hidden" name="id" value="<?= (int)($edit['id'] ?? 0) ?>">
      <label class="block text-sm font-bold">الاسم<input id="cat-name" name="name" required value="<?= e($edit['name'] ?? '') ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">الرابط (slug)<input id="cat-slug" name="slug" dir="ltr" value="<?= e($edit['slug'] ?? '') ?>" class="admin-input mt-1 text-left" placeholder="تلقائي"></label>
      <label class="block text-sm font-bold">الوصف<textarea name="description" rows="2" class="admin-input mt-1 resize-none"><?= e($edit['description'] ?? '') ?></textarea></label>
      <label class="block text-sm font-bold">رابط الصورة<input name="image" dir="ltr" value="<?= e($edit['image'] ?? '') ?>" class="admin-input mt-1 text-left"></label>
      <label class="block text-sm font-bold">أو رفع<input type="file" name="image_file" accept="image/*" class="admin-input mt-1"></label>
      <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="active" <?= ($edit['active'] ?? 1) ? 'checked' : '' ?> class="h-4 w-4"> ظاهر</label>
      <button class="admin-btn w-full justify-center"><?= icon('check', 16) ?> حفظ</button>
      <?php if ($edit): ?><a href="<?= e(admin_url('categories.php')) ?>" class="admin-btn-ghost w-full justify-center">إلغاء التعديل</a><?php endif; ?>
    </form>
  </div>
  <div class="admin-card overflow-x-auto lg:col-span-2">
    <table class="admin-table w-full">
      <thead><tr><th>التصنيف</th><th>المنتجات</th><th>الترتيب</th><th>ظاهر</th><th></th></tr></thead>
      <tbody>
      <?php foreach ($cats as $i => $c): ?>
        <tr class="<?= $c['active'] ? '' : 'opacity-50' ?>">
          <td class="font-bold"><?= e($c['name']) ?></td>
          <td><a href="<?= e(admin_url('products.php?cat=' . (int)$c['id'])) ?>" class="font-bold text-violet-700 hover:underline"><?= (int)$c['products_count'] ?></a></td>
          <td class="whitespace-nowrap">
            <form method="post" class="inline"><input type="hidden" name="action" value="move"><input type="hidden" name="id" value="<?= (int)$c['id'] ?>"><input type="hidden" name="dir" value="up"><button <?= $i === 0 ? 'disabled' : '' ?> class="inline-block text-neutral-400 hover:text-violet-700 disabled:opacity-20" title="رفع"><span class="inline-block rotate-180"><?= icon('chevron-down', 16) ?></span></button></form>
            <form method="post" class="inline"><input type="hidden" name="action" value="move"><input type="hidden" name="id" value="<?= (int)$c['id'] ?>"><input type="hidden" name="dir" value="down"><button <?= $i === count($cats) - 1 ? 'disabled' : '' ?> class="inline-block text-neutral-400 hover:text-violet-700 disabled:opacity-20" title="خفض"><?= icon('chevron-down', 16) ?></button></form>
          </td>
          <td>
            <form method="post" class="inline"><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= (int)$c['id'] ?>">
              <button title="<?= $c['active'] ? 'إخفاء' : 'إظهار' ?>" class="relative inline-block h-5 w-9 rounded-full transition <?= $c['active'] ? 'bg-emerald-500' : 'bg-neutral-300' ?>">
                <span class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all" style="inset-inline-start: <?= $c['active'] ? 'calc(100% - 18px)' : '2px' ?>"></span>
              </button>
            </form>
          </td>
          <td class="whitespace-nowrap">
            <a href="<?= e(admin_url('categories.php?edit=' . (int)$c['id'])) ?>" class="mr-2 inline-block text-neutral-500 hover:text-violet-700"><?= icon('edit', 17) ?></a>
            <button type="button" class="js-cat-del text-neutral-400 hover:text-red-600" data-id="<?= (int)$c['id'] ?>" data-name="<?= e($c['name']) ?>" data-count="<?= (int)$c['products_count'] ?>"><?= icon('trash', 17) ?></button>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
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
