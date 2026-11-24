<?php
require_once __DIR__ . '/_init.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $id = (int)($_POST['id'] ?? 0);
    if ($action === 'save') {
        $name = mb_substr(trim($_POST['name'] ?? ''), 0, 120);
        $fee = max(0, (float)($_POST['fee'] ?? 0));
        $sort = (int)($_POST['sort_order'] ?? 0);
        $active = !empty($_POST['active']) ? 1 : 0;
        if (!$name) { flash('اسم المدينة مطلوب', true); redirect_admin('shipping.php'); }
        $dup = qone('SELECT id FROM cities WHERE name=? AND id<>?', [$name,$id]);
        if ($dup) { flash('المدينة موجودة من قبل', true); redirect_admin('shipping.php'); }
        if ($id && !$active && qone('SELECT active FROM cities WHERE id=?',[$id])['active'] && (int)qone('SELECT COUNT(*) n FROM cities WHERE active=1')['n']<=1) { flash('لا يمكن تعطيل آخر مدينة متاحة',true); redirect_admin('shipping.php'); }
        if ($id) { q('UPDATE cities SET name=?, fee=?, sort_order=?, active=? WHERE id=?', [$name, $fee, $sort, $active, $id]); flash('تم حفظ المدينة'); }
        else {
            $dup = qone('SELECT id FROM cities WHERE name = ?', [$name]);
            if ($dup) { flash('المدينة موجودة من قبل', true); redirect_admin('shipping.php'); }
            q('INSERT INTO cities (name, fee, sort_order, active) VALUES (?, ?, ?, ?)', [$name, $fee, $sort, $active]);
            flash('تمت إضافة المدينة');
        }
    } elseif ($action === 'move' && $id) {
        $ids=array_column(qall('SELECT id FROM cities ORDER BY sort_order,name,id'),'id');
        $i=array_search($id,array_map('intval',$ids)); $j=$i+(($_POST['dir']??'')==='up'?-1:1);
        if($i!==false && isset($ids[$j])) { db()->beginTransaction(); try { [$ids[$i],$ids[$j]]=[$ids[$j],$ids[$i]]; foreach($ids as $n=>$cid) q('UPDATE cities SET sort_order=? WHERE id=?',[$n+1,$cid]); db()->commit(); } catch(Throwable $e) { db()->rollBack(); flash('تعذر تغيير الترتيب',true); redirect_admin('shipping.php'); } }
    } elseif ($action === 'toggle' && $id) {
        if (qone('SELECT active FROM cities WHERE id=?',[$id])['active'] && (int)qone('SELECT COUNT(*) n FROM cities WHERE active=1')['n']<=1) { flash('لا يمكن تعطيل آخر مدينة متاحة',true); redirect_admin('shipping.php'); }
        q('UPDATE cities SET active = 1 - active WHERE id = ?', [$id]);
    } elseif ($action === 'delete' && $id) {
        if (qone('SELECT active FROM cities WHERE id=?',[$id])['active'] && (int)qone('SELECT COUNT(*) n FROM cities WHERE active=1')['n']<=1) { flash('لا يمكن حذف آخر مدينة متاحة',true); redirect_admin('shipping.php'); }
        q('DELETE FROM cities WHERE id = ?', [$id]);
        flash('تم حذف المدينة');
    } elseif ($action === 'threshold') {
        set_setting('free_shipping_threshold', (string)max(0, (float)($_POST['free_shipping_threshold'] ?? 0)));
        flash('تم حفظ حد الشحن المجاني');
    }
    redirect_admin('shipping.php');
}
$edit = isset($_GET['edit']) ? qone('SELECT * FROM cities WHERE id = ?', [(int)$_GET['edit']]) : null;
$cities = qall('SELECT * FROM cities ORDER BY sort_order, name');
admin_header('التوصيل والمدن', 'shipping.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">التوصيل والمدن</h1>
<?php admin_msg(); ?><p class="mt-2 text-xs text-neutral-500">لا يمكن حذف أو تعطيل آخر مدينة متاحة. فعّل مدينة بديلة أولاً.</p>
<div class="admin-card mt-6 p-6">
  <form method="post" class="flex flex-wrap items-end gap-3">
    <input type="hidden" name="action" value="threshold">
    <label class="text-sm font-bold">الشحن المجاني للطلبات من
      <input name="free_shipping_threshold" type="number" step="0.01" min="0" value="<?= e(setting('free_shipping_threshold', '0')) ?>" class="admin-input mt-1 w-44"></label>
    <button class="admin-btn">حفظ</button>
    <span class="text-xs text-neutral-500">اتركها 0 لتعطيل الشحن المجاني</span>
  </form>
</div>
<div class="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
  <div class="admin-card h-fit p-6">
    <h2 class="font-extrabold"><?= $edit ? 'تعديل مدينة' : 'مدينة جديدة' ?></h2>
    <form method="post" class="mt-4 space-y-3">
      <input type="hidden" name="action" value="save"><input type="hidden" name="id" value="<?= (int)($edit['id'] ?? 0) ?>">
      <label class="block text-sm font-bold">اسم المدينة<input name="name" required value="<?= e($edit['name'] ?? '') ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">رسوم التوصيل<input name="fee" type="number" step="0.01" min="0" value="<?= e((string)($edit['fee'] ?? 0)) ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">الترتيب<input name="sort_order" type="number" value="<?= e((string)($edit['sort_order'] ?? 0)) ?>" class="admin-input mt-1"></label>
      <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="active" <?= ($edit['active'] ?? 1) ? 'checked' : '' ?> class="h-4 w-4"> متاحة</label>
      <button class="admin-btn w-full justify-center"><?= icon('check', 16) ?> حفظ</button>
      <?php if ($edit): ?><a href="<?= e(admin_url('shipping.php')) ?>" class="admin-btn-ghost w-full justify-center">إلغاء</a><?php endif; ?>
    </form>
  </div>
  <div class="admin-card overflow-x-auto lg:col-span-2">
    <table class="admin-table w-full">
      <thead><tr><th>المدينة</th><th>الرسوم</th><th>الترتيب</th><th>متاحة</th><th></th></tr></thead>
      <tbody>
      <?php foreach ($cities as $ci => $c): ?>
        <tr class="<?= $c['active'] ? '' : 'opacity-50' ?>">
          <td class="font-bold"><?= e($c['name']) ?></td>
          <td><?= (float)$c['fee'] === 0.0 ? 'مجاني' : e(format_price((float)$c['fee'])) ?></td>
          <td><div class="flex items-center gap-1"><?php foreach(['up'=>'أعلى','down'=>'أسفل'] as $dir=>$label): ?><form method="post"><input type="hidden" name="action" value="move"><input type="hidden" name="id" value="<?= (int)$c['id'] ?>"><input type="hidden" name="dir" value="<?= $dir ?>"><button aria-label="<?= $label ?>" <?= ($dir==='up'?$ci===0:$ci===count($cities)-1)?'disabled':'' ?> class="p-1 disabled:opacity-25"><?= icon('chevron-'.$dir,15) ?></button></form><?php endforeach; ?></div></td>
          <td><form method="post" class="inline"><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= (int)$c['id'] ?>"><button class="<?= $c['active'] ? 'text-emerald-600' : 'text-neutral-300' ?>"><?= icon('check', 18) ?></button></form></td>
          <td class="whitespace-nowrap">
            <a href="<?= e(admin_url('shipping.php?edit=' . (int)$c['id'])) ?>" class="mr-2 inline-block text-neutral-500 hover:text-violet-700"><?= icon('edit', 17) ?></a>
            <form method="post" class="inline" onsubmit="return confirm('حذف المدينة؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$c['id'] ?>"><button class="text-neutral-400 hover:text-red-600"><?= icon('trash', 17) ?></button></form>
          </td>
        </tr>
      <?php endforeach; ?>
      <?php if(!$cities): ?><tr><td colspan="5" class="py-12 text-center text-neutral-500"><b>لا توجد مدن بعد</b><p>أضف مدينة متاحة لتمكين إتمام الطلبات</p></td></tr><?php endif; ?>
      </tbody>
    </table>
  </div>
</div>
<?php admin_footer(); ?>
