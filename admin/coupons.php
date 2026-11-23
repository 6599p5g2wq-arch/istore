<?php
require_once __DIR__ . '/_init.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    handle_program_post('coupons.php');
    $action = $_POST['action'] ?? '';
    $id = (int)($_POST['id'] ?? 0);
    if ($action === 'save') {
        $code = strtoupper(mb_substr(trim($_POST['code'] ?? ''), 0, 60));
        $kind = ($_POST['kind'] ?? 'percent') === 'fixed' ? 'fixed' : 'percent';
        $value = max(0, (float)($_POST['value'] ?? 0));
        $minTotal = max(0, (float)($_POST['min_total'] ?? 0));
        $expires = trim($_POST['expires_at'] ?? '');
        $starts = trim($_POST['starts_at'] ?? '');
        $maxUses = max(0, (int)($_POST['max_uses'] ?? 0));
        $active = !empty($_POST['active']) ? 1 : 0;
        if (!$code || $value <= 0) { flash('الكود والقيمة مطلوبان', true); redirect_admin('coupons.php'); }
        $dup = qone('SELECT id FROM coupons WHERE code = ? AND id != ?', [$code, $id]);
        if ($dup) { flash('هذا الكود مستخدم من قبل', true); redirect_admin('coupons.php'); }
        if ($starts && $expires && $starts > $expires) { flash('تاريخ البداية بعد تاريخ الانتهاء', true); redirect_admin('coupons.php'); }
        if ($id) { q('UPDATE coupons SET code=?, kind=?, value=?, min_total=?, expires_at=?, starts_at=?, max_uses=?, active=? WHERE id=?', [$code, $kind, $value, $minTotal, $expires, $starts, $maxUses, $active, $id]); flash('تم حفظ الكود'); }
        else { q('INSERT INTO coupons (code, kind, value, min_total, expires_at, starts_at, max_uses, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [$code, $kind, $value, $minTotal, $expires, $starts, $maxUses, $active]); flash('تمت إضافة الكود'); }
    } elseif ($action === 'toggle' && $id) {
        q('UPDATE coupons SET active = 1 - active WHERE id = ?', [$id]);
    } elseif ($action === 'delete' && $id) {
        q('DELETE FROM coupons WHERE id = ?', [$id]);
        flash('تم حذف الكود');
    }
    redirect_admin('coupons.php');
}
$edit = isset($_GET['edit']) ? qone('SELECT * FROM coupons WHERE id = ?', [(int)$_GET['edit']]) : null;
$coupons = qall('SELECT c.*, cu.name AS customer_name FROM coupons c LEFT JOIN customers cu ON cu.id = c.customer_id ORDER BY c.id DESC');
$prog = program();
admin_header('أكواد الخصم', 'coupons.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">أكواد الخصم</h1>
<?php admin_msg(); ?>
<div class="mt-6">
  <?php program_panel('welcome', 'كوبون الترحيب للزبائن الجدد', 'يُنشأ تلقائياً لكل زبون عند التسجيل، خاص به وحده ويظهر في صفحة حسابه.', $prog['welcome_enabled'], [
      ['welcome_percent', 'نسبة الخصم %', 10, 1], ['welcome_days', 'مدة الصلاحية (أيام)', 30, 1], ['welcome_max_uses', 'أقصى عدد استخدامات', 1, 1],
  ]); ?>
</div>
<div class="mt-5 grid gap-5 lg:grid-cols-3">
  <div class="admin-card h-fit p-6">
    <h2 class="font-extrabold"><?= $edit ? 'تعديل كود' : 'كود جديد' ?></h2>
    <form method="post" class="mt-4 space-y-3">
      <input type="hidden" name="action" value="save"><input type="hidden" name="id" value="<?= (int)($edit['id'] ?? 0) ?>">
      <label class="block text-sm font-bold">الكود<input name="code" required dir="ltr" value="<?= e($edit['code'] ?? '') ?>" class="admin-input mt-1 text-left uppercase" placeholder="ISTORE10"></label>
      <label class="block text-sm font-bold">النوع<select name="kind" class="admin-input mt-1">
        <option value="percent" <?= ($edit['kind'] ?? '') === 'percent' ? 'selected' : '' ?>>نسبة مئوية %</option>
        <option value="fixed" <?= ($edit['kind'] ?? '') === 'fixed' ? 'selected' : '' ?>>مبلغ ثابت</option>
      </select></label>
      <label class="block text-sm font-bold">القيمة<input name="value" type="number" step="0.01" min="0" required value="<?= e((string)($edit['value'] ?? '')) ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">الحد الأدنى للطلب<input name="min_total" type="number" step="0.01" min="0" value="<?= e((string)($edit['min_total'] ?? 0)) ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">أقصى عدد استخدامات (0 = بلا حد)<input name="max_uses" type="number" min="0" value="<?= (int)($edit['max_uses'] ?? 0) ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">تاريخ البداية (اختياري)<input name="starts_at" type="date" value="<?= e($edit['starts_at'] ?? '') ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">تاريخ الانتهاء (اختياري)<input name="expires_at" type="date" value="<?= e($edit['expires_at'] ?? '') ?>" class="admin-input mt-1"></label>
      <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="active" <?= ($edit['active'] ?? 1) ? 'checked' : '' ?> class="h-4 w-4"> مفعّل</label>
      <button class="admin-btn w-full justify-center"><?= icon('check', 16) ?> حفظ</button>
      <?php if ($edit): ?><a href="<?= e(admin_url('coupons.php')) ?>" class="admin-btn-ghost w-full justify-center">إلغاء التعديل</a><?php endif; ?>
    </form>
  </div>
  <div class="admin-card overflow-x-auto lg:col-span-2">
    <table class="admin-table w-full">
      <thead><tr><th>الكود</th><th>الخصم</th><th>الحد الأدنى</th><th>الفترة</th><th>الاستخدام</th><th>مفعّل</th><th></th></tr></thead>
      <tbody>
      <?php foreach ($coupons as $c): ?>
        <tr class="<?= $c['active'] ? '' : 'opacity-50' ?>">
          <td dir="ltr" class="font-black"><?= e($c['code']) ?></td>
          <td><?= $c['kind'] === 'percent' ? rtrim(rtrim(number_format((float)$c['value'], 2), '0'), '.') . '%' : e(format_price((float)$c['value'])) ?></td>
          <td><?= (float)$c['min_total'] > 0 ? e(format_price((float)$c['min_total'])) : '—' ?></td>
          <td class="text-xs"><?= e(($c['starts_at'] ? 'من ' . $c['starts_at'] . ' ' : '') . ($c['expires_at'] ? 'حتى ' . $c['expires_at'] : ($c['starts_at'] ? '' : '—'))) ?></td>
          <td class="text-xs"><?= (int)$c['used_count'] ?><?= (int)$c['max_uses'] > 0 ? ' من ' . (int)$c['max_uses'] : ' (بلا حد)' ?><?php if ($c['customer_id']): ?><br><span class="text-neutral-400">خاص بـ <?= e($c['customer_name'] ?: '#' . $c['customer_id']) ?></span><?php endif; ?></td>
          <td><form method="post" class="inline"><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= (int)$c['id'] ?>"><button class="<?= $c['active'] ? 'text-emerald-600' : 'text-neutral-300' ?>"><?= icon('check', 18) ?></button></form></td>
          <td class="whitespace-nowrap">
            <a href="<?= e(admin_url('coupons.php?edit=' . (int)$c['id'])) ?>" class="mr-2 inline-block text-neutral-500 hover:text-violet-700"><?= icon('edit', 17) ?></a>
            <form method="post" class="inline" onsubmit="return confirm('حذف الكود؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$c['id'] ?>"><button class="text-neutral-400 hover:text-red-600"><?= icon('trash', 17) ?></button></form>
          </td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$coupons): ?><tr><td colspan="7" class="py-10 text-center text-neutral-400">لا توجد أكواد</td></tr><?php endif; ?>
      </tbody>
    </table>
  </div>
</div>
<?php admin_footer(); ?>
