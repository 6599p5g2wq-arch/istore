<?php
require_once __DIR__ . '/_init.php';
require_admin();
$id = (int)($_GET['id'] ?? 0);
$c = $id ? qone('SELECT * FROM customers WHERE id = ?', [$id]) : null;
if (!$c) { flash('الزبون غير موجود', true); redirect_admin('customers.php'); }
$tempPw = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $act = $_POST['action'] ?? '';
    if ($act === 'update') {
        $name = mb_substr(trim($_POST['name'] ?? ''), 0, 100);
        $email = mb_strtolower(trim($_POST['email'] ?? ''));
        $phone = normalize_libyan_phone($_POST['phone'] ?? '');
        if (!$name) flash('الاسم مطلوب', true);
        elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) flash('البريد الإلكتروني غير صحيح', true);
        elseif (!$phone) flash('رقم الهاتف غير صحيح', true);
        elseif (qone('SELECT id FROM customers WHERE email = ? AND id != ?', [$email, $id])) flash('البريد مستخدم في حساب آخر', true);
        elseif (qone('SELECT id FROM customers WHERE phone = ? AND id != ?', [$phone, $id])) flash('الرقم مستخدم في حساب آخر', true);
        else { q('UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?', [$name, $email, $phone, $id]); flash('تم حفظ البيانات'); }
        redirect_admin('customer.php?id=' . $id);
    } elseif ($act === 'points') {
        $delta = (int)($_POST['delta'] ?? 0);
        if ($delta === 0 || abs($delta) > 10000000) flash('عدد النقاط غير صالح', true);
        else { add_points($id, $delta, trim($_POST['reason'] ?? '') ?: 'تعديل من المشرف'); flash('تم تعديل الرصيد'); }
        redirect_admin('customer.php?id=' . $id);
    } elseif ($act === 'vip') {
        $m = $_POST['vip'] ?? 'auto';
        q('UPDATE customers SET vip_override = ? WHERE id = ?', [$m === 'on' ? 1 : ($m === 'off' ? 0 : null), $id]);
        redirect_admin('customer.php?id=' . $id);
    } elseif ($act === 'block' || $act === 'unblock') {
        $b = $act === 'block' ? 1 : 0;
        q('UPDATE customers SET blocked = ? WHERE id = ?', [$b, $id]);
        if ($b) { q('DELETE FROM customer_sessions WHERE customer_id = ?', [$id]); q('DELETE FROM api_tokens WHERE customer_id = ?', [$id]); }
        flash($b ? 'تم إيقاف الحساب' : 'تم إلغاء إيقاف الحساب');
        redirect_admin('customer.php?id=' . $id);
    } elseif ($act === 'reset') {
        $chars = 'abcdefghjkmnpqrstuvwxyz23456789';
        for ($i = 0; $i < 8; $i++) $tempPw .= $chars[random_int(0, strlen($chars) - 1)];
        q('UPDATE customers SET pass_hash = ?, must_change = 1 WHERE id = ?', [password_hash($tempPw, PASSWORD_DEFAULT), $id]);
        q('DELETE FROM customer_sessions WHERE customer_id = ?', [$id]); q('DELETE FROM api_tokens WHERE customer_id = ?', [$id]);
    } elseif ($act === 'delete') {
        q('UPDATE orders SET customer_id = NULL WHERE customer_id = ?', [$id]);
        q('DELETE FROM customers WHERE id = ?', [$id]);
        flash('تم حذف الحساب (الطلبات محفوظة)');
        redirect_admin('customers.php');
    }
    $c = qone('SELECT * FROM customers WHERE id = ?', [$id]);
}
$orders = qall('SELECT * FROM orders WHERE customer_id = ? OR (customer_id IS NULL AND phone = ?) ORDER BY id DESC', [$id, $c['phone'] ?: "\0"]);
$spent = 0.0; $valid = 0;
foreach ($orders as $o) if ($o['status'] !== 'cancelled') { $spent += (float)$o['total']; $valid++; }
$avg = $valid ? $spent / $valid : 0;
$waPhone = wa_number($c['phone']);
$prog = program();
$vip = is_vip($spent, $c['vip_override'], $prog);
$vipMode = $c['vip_override'] === null ? 'auto' : ((int)$c['vip_override'] === 1 ? 'on' : 'off');
$plog = qall('SELECT delta, reason, created_at FROM points_log WHERE customer_id = ? ORDER BY id DESC LIMIT 20', [$id]);
$backUrl = admin_url('customers.php');
$ref = $_SERVER['HTTP_REFERER'] ?? '';
if ($ref && preg_match('~^https?://' . preg_quote($_SERVER['HTTP_HOST'] ?? '', '~') . '~', $ref) && str_contains($ref, '/admin/customers.php')) $backUrl = $ref;
admin_header($c['name'], 'customers.php');
?>
<a href="<?= e($backUrl) ?>" class="admin-btn-ghost"><?= icon('arrow-left', 16) ?> رجوع للزبائن</a>
<div class="mt-4 flex flex-wrap items-center gap-3">
  <h1 class="text-2xl font-black sm:text-3xl"><?= e($c['name']) ?></h1>
  <?php if ($vip): ?><span class="badge bg-amber-100 text-amber-700">★ VIP</span><?php endif; ?>
  <?php if ($c['blocked']): ?><span class="badge bg-red-100 text-red-600">موقوف</span><?php else: ?><span class="badge bg-emerald-100 text-emerald-700">نشط</span><?php endif; ?>
</div>
<p class="mt-1 text-sm text-neutral-400">مسجّل منذ <?= e(format_date($c['created_at'])) ?><?= $c['last_login'] ? ' · آخر دخول ' . e(format_date($c['last_login'])) : '' ?></p>
<?php admin_msg(); ?>
<div class="mt-6 grid gap-4 sm:grid-cols-3">
  <div class="admin-card p-5"><p class="text-xs text-neutral-400">إجمالي المشتريات</p><p class="mt-1 text-2xl font-black"><?= e(format_price($spent)) ?></p></div>
  <div class="admin-card p-5"><p class="text-xs text-neutral-400">عدد الطلبات</p><p class="mt-1 text-2xl font-black"><?= count($orders) ?></p></div>
  <div class="admin-card p-5"><p class="text-xs text-neutral-400">متوسط الطلب</p><p class="mt-1 text-2xl font-black"><?= e(format_price($avg)) ?></p></div>
</div>
<div class="admin-card mt-5 p-6">
  <h2 class="mb-1 font-extrabold">نقاط الولاء</h2>
  <p class="text-2xl font-black"><?= (int)$c['points'] ?> <span class="text-sm font-bold text-neutral-400">نقطة<?= $prog['loyalty_enabled'] ? '' : ' (البرنامج متوقف)' ?></span></p>
  <form method="post" class="mt-4 flex flex-wrap items-end gap-2">
    <input type="hidden" name="action" value="points">
    <label class="w-32 text-xs font-bold">± نقاط<input name="delta" type="number" required class="admin-input mt-1" placeholder="50 أو -20"></label>
    <label class="min-w-[160px] flex-1 text-xs font-bold">السبب<input name="reason" class="admin-input mt-1" placeholder="تعويض، هدية..."></label>
    <button class="admin-btn">تطبيق</button>
  </form>
  <form method="post" class="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold">
    <input type="hidden" name="action" value="vip"><span class="text-neutral-500">وسم VIP:</span>
    <?php foreach (['auto' => 'تلقائي', 'on' => 'مفعّل يدوياً', 'off' => 'معطّل'] as $k => $l): ?>
      <button name="vip" value="<?= $k ?>" class="rounded-full px-3 py-1.5 <?= $vipMode === $k ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500' ?>"><?= $l ?></button>
    <?php endforeach; ?>
  </form>
  <?php if ($plog): ?><ul class="mt-4 divide-y divide-neutral-100 text-sm">
    <?php foreach ($plog as $l): ?><li class="flex items-center justify-between gap-3 py-2"><span class="text-neutral-600"><?= e($l['reason']) ?></span><span class="flex items-center gap-3"><span class="text-xs text-neutral-400"><?= e(format_date($l['created_at'])) ?></span><b dir="ltr" class="<?= (int)$l['delta'] > 0 ? 'text-emerald-600' : 'text-red-600' ?>"><?= (int)$l['delta'] > 0 ? '+' : '' ?><?= (int)$l['delta'] ?></b></span></li><?php endforeach; ?>
  </ul><?php endif; ?>
</div>
<div class="admin-card mt-5 p-6">
  <h2 class="mb-4 font-extrabold">معلومات التواصل</h2>
  <p class="flex items-center gap-2 text-sm text-neutral-600"><?= icon('phone', 15) ?> <a dir="ltr" href="tel:<?= e($c['phone']) ?>"><?= e($c['phone'] ?: '—') ?></a></p>
  <p class="mt-2 flex items-center gap-2 text-sm text-neutral-600"><?= icon('mail', 15) ?> <span dir="ltr"><?= e($c['email']) ?></span></p>
  <?php if ($c['city'] || $c['address']): ?><p class="mt-2 flex items-center gap-2 text-sm text-neutral-600"><?= icon('map-pin', 15) ?> <?= e($c['city']) ?><?= $c['address'] ? ' — ' . e($c['address']) : '' ?></p><?php endif; ?>
  <a href="https://wa.me/<?= e($waPhone) ?>" target="_blank" rel="noopener" class="mt-4 inline-block rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white">مراسلة واتساب</a>
</div>
<?php
$addrs = [];
foreach ($orders as $o) {
    $k = trim($o['city'] . '||' . $o['address']);
    if (isset($addrs[$k])) $addrs[$k]['n']++; else $addrs[$k] = ['city' => $o['city'], 'address' => $o['address'], 'n' => 1, 'last' => $o['created_at']];
}
?>
<div class="admin-card mt-5 p-6">
  <h2 class="mb-4 flex items-center gap-2 font-extrabold"><?= icon('map-pin', 17) ?> العناوين</h2>
  <p class="text-xs font-bold text-neutral-400">العنوان المحفوظ في الحساب</p>
  <?php if ($c['city'] || $c['address']): ?><p class="mt-1.5 rounded-2xl bg-neutral-50 px-4 py-3 text-sm font-bold"><?= e($c['city']) ?><?= $c['address'] ? ' — ' . e($c['address']) : '' ?></p>
  <?php else: ?><p class="mt-1.5 text-sm text-neutral-400">لم يحفظ الزبون عنواناً بعد</p><?php endif; ?>
  <p class="mt-5 text-xs font-bold text-neutral-400">عناوين من طلباته السابقة</p>
  <?php if (!$addrs): ?><p class="mt-1.5 text-sm text-neutral-400">لا توجد طلبات</p><?php else: ?>
  <ul class="mt-1.5 space-y-2">
    <?php foreach ($addrs as $a): ?>
      <li class="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-neutral-50 px-4 py-3 text-sm"><span class="font-bold"><?= e($a['city']) ?><?= $a['address'] ? ' — ' . e($a['address']) : '' ?></span><span class="text-xs text-neutral-400"><?= (int)$a['n'] ?> <?= $a['n'] === 1 ? 'طلب' : 'طلبات' ?> · آخر استخدام <?= e(format_date($a['last'])) ?></span></li>
    <?php endforeach; ?>
  </ul><?php endif; ?>
</div>
<div class="admin-card mt-5 overflow-x-auto p-6">
  <h2 class="mb-2 font-extrabold">طلباته</h2>
  <?php if (!$orders): ?><p class="py-6 text-center text-sm text-neutral-400">لا توجد طلبات</p><?php else: ?>
  <table class="admin-table w-full min-w-[520px]">
    <thead><tr><th>رقم الطلب</th><th>التاريخ</th><th>الحالة</th><th>الإجمالي</th></tr></thead>
    <tbody>
    <?php foreach ($orders as $o): ?>
      <tr>
        <td dir="ltr"><a href="<?= e(admin_url('order.php?id=' . (int)$o['id'])) ?>" class="font-extrabold text-violet-700 hover:underline"><?= e($o['code']) ?></a><?php if ($o['customer_id'] === null): ?> <span class="text-[11px] text-neutral-400">(كزائر بنفس الهاتف)</span><?php endif; ?></td>
        <td class="text-neutral-500"><?= e(format_date($o['created_at'])) ?></td>
        <td><span class="badge <?= order_status_class($o['status']) ?>"><?= e(order_status_label($o['status'])) ?></span></td>
        <td class="font-bold"><?= e(format_price((float)$o['total'])) ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div>
<form method="post" class="admin-card mt-5 p-6">
  <input type="hidden" name="action" value="update">
  <h2 class="mb-4 font-extrabold">تعديل البيانات</h2>
  <div class="grid gap-4 sm:grid-cols-2">
    <label class="text-sm font-bold">الاسم<input name="name" required value="<?= e($c['name']) ?>" class="admin-input mt-1.5"></label>
    <label class="text-sm font-bold">الهاتف<input name="phone" required dir="ltr" value="<?= e($c['phone']) ?>" class="admin-input mt-1.5"></label>
    <label class="text-sm font-bold sm:col-span-2">البريد<input type="email" name="email" required dir="ltr" value="<?= e($c['email']) ?>" class="admin-input mt-1.5"></label>
  </div>
  <button class="admin-btn mt-4">حفظ</button>
</form>
<div class="admin-card mt-5 p-6">
  <h2 class="mb-4 font-extrabold">إجراءات الحساب</h2>
  <div class="flex flex-wrap gap-3">
    <form method="post" onsubmit="return confirm('إنشاء كلمة مرور مؤقتة؟ ستنتهي كلمة مروره الحالية ويُسجَّل خروجه.')"><input type="hidden" name="action" value="reset"><button class="admin-btn-ghost">إعادة تعيين كلمة المرور</button></form>
    <form method="post" onsubmit="return confirm('<?= $c['blocked'] ? 'إلغاء إيقاف الحساب؟' : 'إيقاف هذا الحساب؟ سيُسجَّل خروجه ولن يستطيع الدخول.' ?>')"><input type="hidden" name="action" value="<?= $c['blocked'] ? 'unblock' : 'block' ?>"><button class="admin-btn-ghost <?= $c['blocked'] ? '' : 'text-amber-700' ?>"><?= $c['blocked'] ? 'إلغاء الإيقاف' : 'إيقاف الحساب' ?></button></form>
    <form method="post" onsubmit="return confirm('حذف الحساب نهائياً؟ تبقى طلباته محفوظة بدون ربط بالحساب.')"><input type="hidden" name="action" value="delete"><button class="admin-btn-ghost admin-btn-danger">حذف الحساب</button></form>
  </div>
  <?php if ($tempPw): ?>
  <div class="mt-5 rounded-2xl bg-emerald-50 p-4">
    <p class="text-sm font-bold text-emerald-800">كلمة المرور المؤقتة (تظهر مرة واحدة):</p>
    <div class="mt-2 flex flex-wrap items-center gap-3">
      <code dir="ltr" class="rounded-xl bg-white px-4 py-2 text-lg font-extrabold tracking-wider"><?= e($tempPw) ?></code>
      <a href="https://wa.me/<?= e($waPhone) ?>?text=<?= rawurlencode('السلام عليكم ' . $c['name'] . '، معك ' . setting('store_name', 'آي ستور') . ".\nكلمة المرور المؤقتة لحسابك: " . $tempPw . "\nادخل بها ثم غيّرها من صفحة «حسابي».") ?>" target="_blank" rel="noopener" class="rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white">إرسالها عبر واتساب</a>
    </div>
  </div>
  <?php endif; ?>
</div>
<?php admin_footer(); ?>
