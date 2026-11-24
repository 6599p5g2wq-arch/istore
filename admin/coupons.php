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
        if ($kind === 'percent') $value = min($value, 90);
        $minTotal = max(0, (float)($_POST['min_total'] ?? 0));
        $expires = trim($_POST['expires_at'] ?? '');
        $starts = trim($_POST['starts_at'] ?? '');
        $maxUses = max(0, (int)($_POST['max_uses'] ?? 0));
        $customerId = (int)($_POST['customer_id'] ?? 0) ?: null;
        $active = !empty($_POST['active']) ? 1 : 0;
        if (!$code || $value <= 0) { flash('الكود والقيمة مطلوبان', true); redirect_admin('coupons.php'); }
        $dup = qone('SELECT id FROM coupons WHERE code = ? AND id != ?', [$code, $id]);
        if ($dup) { flash('هذا الكود مستخدم من قبل', true); redirect_admin('coupons.php'); }
        if ($starts && $expires && $starts > $expires) { flash('تاريخ البداية بعد تاريخ الانتهاء', true); redirect_admin('coupons.php'); }
        if ($customerId && !qone('SELECT id FROM customers WHERE id = ?', [$customerId])) { flash('الزبون غير موجود', true); redirect_admin('coupons.php'); }
        if ($id) { q('UPDATE coupons SET code=?, kind=?, value=?, min_total=?, expires_at=?, starts_at=?, max_uses=?, active=?, customer_id=? WHERE id=?', [$code, $kind, $value, $minTotal, $expires, $starts, $maxUses, $active, $customerId, $id]); flash('تم حفظ الكود'); }
        else { q('INSERT INTO coupons (code, kind, value, min_total, expires_at, starts_at, max_uses, active, customer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [$code, $kind, $value, $minTotal, $expires, $starts, $maxUses, $active, $customerId]); flash('تمت إضافة الكود'); }
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
$customers = qall('SELECT id, name, phone FROM customers ORDER BY name LIMIT 1000');
$prog = program();
$today = date('Y-m-d');
$statsActive = (int)(qone('SELECT COUNT(*) AS c FROM coupons WHERE active = 1')['c'] ?? 0);
$statsUses = (int)(qone('SELECT COALESCE(SUM(used_count),0) AS s FROM coupons')['s'] ?? 0);
$statsDiscount = (float)(qone("SELECT COALESCE(SUM(discount),0) AS s FROM orders WHERE coupon_code IS NOT NULL AND coupon_code != ''")['s'] ?? 0);
function coupon_status(array $c, string $today): array {
    if (!$c['active']) return ['disabled', 'معطل', 'bg-neutral-100 text-neutral-500'];
    if ($c['expires_at'] && $c['expires_at'] < $today) return ['expired', 'منتهي', 'bg-red-100 text-red-600'];
    if ($c['starts_at'] && $c['starts_at'] > $today) return ['scheduled', 'لم يبدأ بعد', 'bg-amber-100 text-amber-700'];
    if ((int)$c['max_uses'] > 0 && (int)$c['used_count'] >= (int)$c['max_uses']) return ['usedup', 'اكتمل استخدامه', 'bg-sky-100 text-sky-700'];
    return ['active', 'فعال', 'bg-emerald-100 text-emerald-700'];
}
admin_header('أكواد الخصم', 'coupons.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">أكواد الخصم</h1><p class="mt-1 text-sm text-neutral-500">أنشئ كوبونات تسويقية — الزبون يطبقها عند إتمام الطلب</p>
<?php admin_msg(); ?>
<div class="mt-6">
  <?php program_panel('welcome', 'كوبون الترحيب للزبائن الجدد', 'يُنشأ تلقائياً لكل زبون عند التسجيل، خاص به وحده ويظهر في صفحة حسابه.', $prog['welcome_enabled'], [
      ['welcome_percent', 'نسبة الخصم %', 10, 1], ['welcome_days', 'مدة الصلاحية (أيام)', 30, 1], ['welcome_max_uses', 'أقصى عدد استخدامات', 1, 1],
  ]); ?>
</div>
<div class="mt-5 grid grid-cols-3 gap-3">
  <div class="admin-card p-4"><p class="text-xs text-neutral-500">كوبونات فعالة</p><p class="mt-1 text-xl font-black"><?= $statsActive ?></p></div>
  <div class="admin-card p-4"><p class="text-xs text-neutral-500">إجمالي الاستخدامات</p><p class="mt-1 text-xl font-black"><?= $statsUses ?></p></div>
  <div class="admin-card p-4"><p class="text-xs text-neutral-500">إجمالي الخصم الممنوح</p><p class="mt-1 text-xl font-black"><?= e(format_price($statsDiscount)) ?></p></div>
</div>
<div class="mt-4 flex flex-wrap items-center gap-2">
  <input id="couponSearch" dir="ltr" placeholder="بحث بالكود…" class="w-44 rounded-full border border-neutral-200 bg-white px-4 py-2 text-left text-sm outline-none focus:border-neutral-900">
  <?php foreach (['all' => 'الكل', 'active' => 'فعال', 'disabled' => 'معطل', 'expired' => 'منتهي', 'customer' => 'خاص بزبون'] as $k => $label): ?>
    <button type="button" data-chip="<?= $k ?>" class="coupon-chip rounded-full px-4 py-2 text-xs font-bold transition <?= $k === 'all' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500' ?>"><?= $label ?></button>
  <?php endforeach; ?>
</div>
<div class="mt-4 grid gap-6 lg:grid-cols-3">
  <div class="order-2 admin-card h-fit p-6 lg:sticky lg:top-8">
    <h2 class="font-extrabold"><?= $edit ? 'تعديل كود' : 'إنشاء كود خصم' ?></h2>
    <form method="post" class="mt-4 space-y-3">
      <input type="hidden" name="action" value="save"><input type="hidden" name="id" value="<?= (int)($edit['id'] ?? 0) ?>">
      <label class="block text-sm font-bold">الكود<input name="code" required dir="ltr" value="<?= e($edit['code'] ?? '') ?>" class="admin-input mt-1 text-left uppercase" placeholder="ISTORE10"></label>
      <label class="block text-sm font-bold">النوع<select name="kind" id="kindSelect" class="admin-input mt-1">
        <option value="percent" <?= ($edit['kind'] ?? '') === 'percent' ? 'selected' : '' ?>>نسبة مئوية %</option>
        <option value="fixed" <?= ($edit['kind'] ?? '') === 'fixed' ? 'selected' : '' ?>>مبلغ ثابت</option>
      </select></label>
      <label class="block text-sm font-bold">القيمة<input name="value" id="valueInput" type="number" step="0.01" min="0" required value="<?= e((string)($edit['value'] ?? '')) ?>" class="admin-input mt-1"><span id="percentHint" class="mt-1 block text-[11px] font-normal text-neutral-400">حتى 90% كحد أقصى</span></label>
      <label class="block text-sm font-bold">الحد الأدنى للطلب<input name="min_total" type="number" step="0.01" min="0" value="<?= e((string)($edit['min_total'] ?? 0)) ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">أقصى عدد استخدامات (0 = بلا حد)<input name="max_uses" type="number" min="0" value="<?= (int)($edit['max_uses'] ?? 0) ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">خاص بزبون (اختياري)<select name="customer_id" class="admin-input mt-1">
        <option value="">لكل الزبائن</option>
        <?php foreach ($customers as $cu): ?><option value="<?= (int)$cu['id'] ?>" <?= (int)($edit['customer_id'] ?? 0) === (int)$cu['id'] ? 'selected' : '' ?>><?= e($cu['name']) ?><?= $cu['phone'] ? ' — ' . e($cu['phone']) : '' ?></option><?php endforeach; ?>
      </select></label>
      <label class="block text-sm font-bold">تاريخ البداية (اختياري)<input name="starts_at" type="date" value="<?= e($edit['starts_at'] ?? '') ?>" class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">تاريخ الانتهاء (اختياري)<input name="expires_at" type="date" value="<?= e($edit['expires_at'] ?? '') ?>" class="admin-input mt-1"></label>
      <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="active" <?= ($edit['active'] ?? 1) ? 'checked' : '' ?> class="h-4 w-4"> مفعّل</label>
      <button class="admin-btn w-full justify-center"><?= icon('check', 16) ?> حفظ</button>
      <?php if ($edit): ?><a href="<?= e(admin_url('coupons.php')) ?>" class="admin-btn-ghost w-full justify-center">إلغاء التعديل</a><?php endif; ?>
    </form>
  </div>
<div class="order-1 space-y-3 lg:col-span-2">
<?php foreach($coupons as $c):[$stKey,$stLabel,$stCls]=coupon_status($c,$today); ?>
<div class="coupon-row flex flex-wrap items-center gap-3 rounded-3xl bg-white p-5 shadow-sm" data-code="<?=e(mb_strtolower($c['code']))?>" data-status="<?=$stKey?>" data-customer="<?=$c['customer_id']?'1':''?>"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-black text-white"><?=icon('ticket',19)?></span><div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><p class="font-extrabold" dir="ltr"><?=e($c['code'])?></p><span class="rounded-full px-2.5 py-0.5 text-[11px] font-bold <?=$stCls?>"><?=$stLabel?></span></div><p class="mt-0.5 text-xs text-neutral-500"><?=e($c['kind']==='percent'?'خصم '.(float)$c['value'].'%':'خصم '.format_price($c['value']))?><?php if((float)$c['min_total']>0): ?> — حد أدنى <?=e(format_price($c['min_total']))?><?php endif; ?><?php if($c['starts_at']): ?> — من <?=e($c['starts_at'])?><?php endif; ?><?php if($c['expires_at']): ?> — حتى <?=e($c['expires_at'])?><?php endif; ?> — استُخدم <?=(int)$c['used_count']?><?=$c['max_uses']?' من '.(int)$c['max_uses']:' (بلا حد)'?><?php if($c['customer_id']): ?> — خاص بالزبون <?=e($c['customer_name']?:'#'.$c['customer_id'])?><?php endif; ?></p>
<?php if($c['max_uses']>0): ?><div class="mt-1.5 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-neutral-100"><div class="h-full rounded-full bg-black" style="width:<?=min(100,round($c['used_count']/$c['max_uses']*100))?>%"></div></div><?php endif; ?></div>
<div class="flex flex-wrap items-center gap-2"><button type="button" class="copy-code grid h-9 w-9 place-items-center rounded-full bg-neutral-100" data-code="<?=e($c['code'])?>" title="نسخ الكود"><?=icon('copy',15)?></button><a href="https://wa.me/?text=<?=rawurlencode('استعمل الكود: '.$c['code'])?>" target="_blank" rel="noopener" class="grid h-9 w-9 place-items-center rounded-full bg-neutral-100" title="مشاركة عبر واتساب"><?=icon('share',15)?></a><a href="<?=e(admin_url('coupons.php?edit='.(int)$c['id']))?>" class="grid h-9 w-9 place-items-center rounded-full bg-neutral-100" title="تعديل"><?=icon('edit',15)?></a><form method="post"><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?=(int)$c['id']?>"><button class="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-600"><?=$c['active']?'تعطيل':'تفعيل'?></button></form><form method="post" onsubmit="return confirm('حذف الكود؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?=(int)$c['id']?>"><button class="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-500"><?=icon('trash',15)?></button></form></div></div>
<?php endforeach; ?>
<p id="noCouponResults" class="<?=count($coupons)?'hidden':''?> rounded-3xl bg-white p-10 text-center text-sm text-neutral-400 shadow-sm"><?=count($coupons)?'لا نتائج مطابقة':'لا توجد أكواد خصم بعد'?></p></div>
</div>
<script>
(function () {
  var chip = 'all';
  var search = document.getElementById('couponSearch');
  var chips = document.querySelectorAll('.coupon-chip');
  var rows = document.querySelectorAll('.coupon-row');
  var empty = document.getElementById('noCouponResults');
  function apply() {
    var q = (search.value || '').trim().toLowerCase();
    var shown = 0;
    rows.forEach(function (r) {
      var ok = true;
      if (chip === 'customer') ok = r.dataset.customer === '1';
      else if (chip !== 'all') ok = r.dataset.status === chip;
      if (ok && q) ok = r.dataset.code.indexOf(q) !== -1;
      r.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    if (empty) empty.classList.toggle('hidden', shown !== 0);
  }
  chips.forEach(function (b) {
    b.addEventListener('click', function () {
      chip = b.dataset.chip;
      chips.forEach(function (x) {
        var on = x === b;
        x.className = 'coupon-chip rounded-full px-4 py-2 text-xs font-bold transition ' + (on ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500');
      });
      apply();
    });
  });
  if (search) search.addEventListener('input', apply);
  document.querySelectorAll('.copy-code').forEach(function (b) {
    b.addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.code);
      b.classList.add('text-emerald-600');
      setTimeout(function () { b.classList.remove('text-emerald-600'); }, 1200);
    });
  });
  var kind = document.getElementById('kindSelect'), val = document.getElementById('valueInput'), hint = document.getElementById('percentHint');
  function capValue() {
    var isP = kind.value === 'percent';
    if (hint) hint.style.display = isP ? '' : 'none';
    if (isP && parseFloat(val.value) > 90) val.value = 90;
  }
  if (kind && val) { kind.addEventListener('change', capValue); val.addEventListener('input', capValue); capValue(); }
})();
</script>
<?php admin_footer(); ?>
