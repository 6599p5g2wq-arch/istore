<?php
require __DIR__ . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';

function normalize_phone(string $p): string {
    $p = preg_replace('/[^\d+]/', '', $p);
    return preg_replace('/^\+?218/', '0', $p);
}

$input=$_SERVER['REQUEST_METHOD']==='POST'?$_POST:$_GET;
$code = strtoupper(trim(is_string($input['code']??null)?$input['code']:''));
$phone = trim(is_string($_POST['phone']??null)?$_POST['phone']:'');
$order = null; $items = []; $error = '';
if ($code !== '' && $phone !== '') {
    if(rate_limited('tracking:'.client_ip(),8)){http_response_code(429);exit('محاولات كثيرة، حاول لاحقا');}
    $order = qone('SELECT * FROM orders WHERE UPPER(code) = ?', [$code]);
    if (!$order || normalize_phone($order['phone']) !== normalize_phone($phone)) {
        $order = null;
        $error = 'لم يتم العثور على طلب بهذه البيانات';
    } else {
        $items = qall('SELECT name, qty, variant_label FROM order_items WHERE order_id = ?', [$order['id']]);
    }
}
$statusMeta=['new'=>['قيد المراجعة','clock','text-amber-400 bg-amber-500/10'],'confirmed'=>['تم التأكيد','check','text-blue-400 bg-blue-500/10'],'shipped'=>['في الطريق إليك','truck','text-purple-400 bg-purple-500/10'],'delivered'=>['تم التوصيل','check','text-emerald-400 bg-emerald-500/10'],'cancelled'=>['ملغي','x','text-red-400 bg-red-500/10']];
$page_title = 'تتبع طلبك';
require APP_ROOT . '/includes/store-header.php';
?>
<div class="mx-auto max-w-2xl px-4 pt-16 sm:px-6">
  <h1 class="text-center text-3xl font-black sm:text-4xl">تتبع طلبك</h1>
  <p class="mt-3 text-center text-[var(--text-faint)]">أدخل رقم الطلب ورقم هاتفك لمعرفة حالة طلبك</p>

  <form method="post" action="<?= url('track.php') ?>" class="mt-10 space-y-4 rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6">
    <label class="block text-sm font-bold">رقم الطلب
      <input name="code" required dir="ltr" value="<?= e($code) ?>" placeholder="IST-XXXXXX" class="mt-1.5 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-left outline-none transition placeholder:text-[var(--text-dim)] placeholder:opacity-90 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20">
    </label>
    <label class="block text-sm font-bold">رقم الهاتف المستخدم في الطلب
      <input name="phone" required dir="ltr" inputmode="tel" value="<?= e($phone) ?>" placeholder="09XXXXXXXX" class="mt-1.5 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-left outline-none transition placeholder:text-[var(--text-dim)] placeholder:opacity-90 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20">
    </label>
    <button class="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 font-bold text-black transition hover:bg-neutral-200"><?=icon('search',18)?> تتبع</button>
  </form>

  <?php if ($error): ?>
    <p class="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-center text-sm font-bold text-red-400"><?= e($error) ?></p>
  <?php endif; ?>

  <?php if ($order): ?>
    <div class="reveal mt-6 rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6">
      <?php $st=$statusMeta[$order['status']]??$statusMeta['new']; ?><div class="flex items-center gap-3 rounded-2xl p-4 <?=$st[2]?>"><?=icon($st[1],26)?><div><p class="font-extrabold"><?=e($st[0])?></p><p class="text-xs opacity-70">آخر تحديث لحالة طلبك</p></div><span class="mr-auto font-extrabold" dir="ltr"><?=e($order['code'])?></span></div>
      <ul class="mt-4 space-y-2 text-sm text-[var(--text)]"><?php foreach($items as $it):?><li class="flex items-center gap-2"><?=icon('package',14,'text-[var(--text-faint)]')?><?=e($it['name'])?><?=!empty($it['variant_label'])?' · '.e($it['variant_label']):''?><span class="text-[var(--text-faint)]">× <?=(int)$it['qty']?></span></li><?php endforeach;?></ul><div class="mt-4 flex justify-between border-t border-[var(--border)] pt-4 text-sm"><span class="text-[var(--text-dim)]"><?=e($order['city'])?> · <?=e(format_date($order['created_at']))?></span><span class="font-extrabold text-white"><?=e(format_price($order['total']))?></span></div>
    </div>
  <?php endif; ?>
</div>
<?php require APP_ROOT . '/includes/store-footer.php'; ?>
