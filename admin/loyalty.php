<?php
require_once __DIR__ . '/_init.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') handle_program_post('loyalty.php');
$p = program();
$todayThreshold = (float)$p['vip_threshold'];
$spend = "COALESCE((SELECT SUM(o.total) FROM orders o WHERE o.customer_id = c.id AND o.status != 'cancelled'), 0)";
$withPoints = (int)(qone('SELECT COUNT(*) AS c FROM customers WHERE points > 0')['c'] ?? 0);
$totalPoints = (int)(qone('SELECT COALESCE(SUM(points),0) AS s FROM customers')['s'] ?? 0);
$redeemed = (float)(qone('SELECT COALESCE(SUM(points_discount),0) AS s FROM orders')['s'] ?? 0);
$vipCount = (int)(qone("SELECT COUNT(*) AS c FROM customers c WHERE c.vip_override = 1 OR (c.vip_override IS NULL AND $spend >= ?)", [$todayThreshold])['c'] ?? 0);
$top = qall("SELECT c.id, c.name, c.points, c.vip_override, $spend AS spent FROM customers c ORDER BY c.points DESC, spent DESC LIMIT 8");
$nearVip = qall("SELECT c.id, c.name, $spend AS spent FROM customers c WHERE c.vip_override IS NULL AND $spend >= ? AND $spend < ? ORDER BY spent DESC LIMIT 8", [round($todayThreshold * 0.7), $todayThreshold]);
$plog = qall('SELECT pl.id, pl.delta, pl.reason, pl.order_id, pl.created_at, c.name FROM points_log pl JOIN customers c ON c.id = pl.customer_id ORDER BY pl.id DESC LIMIT 15');
admin_header('الولاء و VIP', 'loyalty.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">الولاء و VIP</h1>
<p class="mt-1 text-sm text-neutral-500">نقاط على الطلبات المكتملة يستبدلها الزبون بخصم، وشارة VIP لأفضل الزبائن</p>
<?php admin_msg(); ?>
<div class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
  <div class="admin-card p-4"><p class="text-xs text-neutral-500">زبائن لديهم نقاط</p><p class="mt-1 text-xl font-black"><?= $withPoints ?></p></div>
  <div class="admin-card p-4"><p class="text-xs text-neutral-500">إجمالي النقاط القائمة</p><p class="mt-1 text-xl font-black"><?= number_format($totalPoints) ?></p></div>
  <div class="admin-card p-4"><p class="text-xs text-neutral-500">زبائن VIP</p><p class="mt-1 text-xl font-black"><?= $vipCount ?></p></div>
  <div class="admin-card p-4"><p class="text-xs text-neutral-500">خصومات نقاط مستبدلة</p><p class="mt-1 text-xl font-black"><?= e(format_price($redeemed)) ?></p></div>
</div>
<div class="mt-6 grid max-w-4xl gap-5 lg:grid-cols-2">
  <div class="space-y-3">
    <?php program_panel('loyalty', 'نقاط الولاء', 'تُمنح النقاط عند تحويل الطلب إلى «تم التوصيل»، ويستبدلها الزبون عند إتمام الطلب.', $p['loyalty_enabled'], [
        ['loyalty_per_lyd', 'نقاط لكل 1 د.ل', 1, 0.01, '1'],
        ['loyalty_redeem_points', 'عدد النقاط للاستبدال', 100, 1],
        ['loyalty_redeem_value', 'قيمة الخصم (د.ل)', 5, 0.01, '5 د.ل مقابل 100 نقطة'],
    ], true); ?>
    <div class="rounded-3xl bg-neutral-50 p-5">
      <p class="flex items-center gap-2 text-sm font-extrabold"><?= icon('sliders', 15) ?> جرّب الحسبة</p>
      <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span>طلب بقيمة</span>
        <input id="simAmount" type="number" min="0" value="500" dir="ltr" class="w-28 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-center outline-none focus:border-neutral-900">
        <span>د.ل</span>
        <span class="font-black text-emerald-700">يكسب الزبون <span id="simEarned"></span> نقطة</span>
        <span class="text-neutral-400">=</span>
        <span class="font-black">خصم <span id="simWorth"></span> د.ل</span>
      </div>
      <p class="mt-2 text-xs text-neutral-500">كل <?= number_format((float)$p['redeem_points']) ?> نقطة = <?= e(format_price((float)$p['redeem_value'])) ?> عند الاستبدال. الحسبة للتوضيح فقط ولا تغيّر أي إعداد.</p>
    </div>
  </div>
  <?php program_panel('vip', 'زبون VIP', 'يُوسم الزبون تلقائياً عند بلوغ حد الإنفاق (طلبات غير ملغاة)، ويمكنك تفعيله أو إلغاءه يدوياً من صفحة الزبون.', $p['vip_enabled'], [
      ['vip_threshold', 'حد الإنفاق (د.ل)', 2000, 1],
  ], true); ?>
</div>
<div class="mt-6 grid gap-5 lg:grid-cols-2">
  <div class="admin-card p-6">
    <h2 class="font-extrabold">أفضل الزبائن بالنقاط</h2>
    <?php if (!$top): ?><p class="py-8 text-center text-sm text-neutral-400">لا زبائن بعد</p><?php endif; ?>
    <div class="mt-3 space-y-2">
      <?php foreach ($top as $i => $c): ?>
        <a href="<?= e(admin_url('customer.php?id=' . (int)$c['id'])) ?>" class="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-neutral-50">
          <span class="w-5 text-center text-sm font-black text-neutral-300"><?= $i + 1 ?></span>
          <span class="min-w-0 flex-1 truncate text-sm font-bold"><?= e($c['name']) ?> <?php if (is_vip((float)$c['spent'], $c['vip_override'], $p)): ?><span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">★ VIP</span><?php endif; ?></span>
          <span class="text-xs text-neutral-400"><?= e(format_price((float)$c['spent'])) ?></span>
          <span class="text-sm font-black"><?= number_format((int)$c['points']) ?> نقطة</span>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
  <div class="admin-card p-6">
    <h2 class="font-extrabold">قريبون من VIP</h2>
    <p class="mt-1 text-xs text-neutral-500">أنفقوا 70% أو أكثر من الحد (<?= e(format_price($todayThreshold)) ?>)<?= $p['vip_enabled'] ? '' : ' — برنامج VIP متوقف حالياً' ?></p>
    <?php if (!$nearVip): ?><p class="py-8 text-center text-sm text-neutral-400">لا أحد قريب من الحد</p><?php endif; ?>
    <div class="mt-3 space-y-3">
      <?php foreach ($nearVip as $c): ?>
        <a href="<?= e(admin_url('customer.php?id=' . (int)$c['id'])) ?>" class="block rounded-2xl px-3 py-2 transition hover:bg-neutral-50">
          <div class="flex items-center justify-between text-sm">
            <span class="font-bold"><?= e($c['name']) ?></span>
            <span class="text-xs text-neutral-500"><?= e(format_price((float)$c['spent'])) ?> من <?= e(format_price($todayThreshold)) ?></span>
          </div>
          <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div class="h-full rounded-full bg-amber-500" style="width: <?= min(100, (int)round($c['spent'] / $todayThreshold * 100)) ?>%"></div>
          </div>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
</div>
<div class="mt-6 admin-card p-6">
  <h2 class="font-extrabold">آخر حركات النقاط</h2>
  <?php if (!$plog): ?><p class="py-8 text-center text-sm text-neutral-400">لا حركات نقاط بعد</p><?php endif; ?>
  <?php if ($plog): ?>
  <div class="mt-3 overflow-x-auto">
    <table class="admin-table w-full min-w-[560px]">
      <thead><tr><th>الزبون</th><th>النقاط</th><th>السبب</th><th>الطلب</th><th>التاريخ</th></tr></thead>
      <tbody>
        <?php foreach ($plog as $r): ?>
          <tr>
            <td class="font-bold"><?= e($r['name']) ?></td>
            <td class="font-black <?= $r['delta'] >= 0 ? 'text-emerald-600' : 'text-red-500' ?>" dir="ltr"><?= $r['delta'] >= 0 ? '+' : '' ?><?= (int)$r['delta'] ?></td>
            <td class="text-neutral-600"><?= e($r['reason']) ?></td>
            <td class="text-neutral-400"><?= $r['order_id'] ? '#' . (int)$r['order_id'] : '—' ?></td>
            <td class="text-xs text-neutral-400"><?= e(date('Y/m/d h:i A', strtotime($r['created_at']))) ?></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php endif; ?>
</div>
<script>
(function () {
  var perLyd = <?= json_encode((float)$p['loyalty_per_lyd']) ?>;
  var redeemPoints = <?= json_encode(max(1, (float)$p['redeem_points'])) ?>;
  var redeemValue = <?= json_encode((float)$p['redeem_value']) ?>;
  var input = document.getElementById('simAmount');
  var earnedEl = document.getElementById('simEarned');
  var worthEl = document.getElementById('simWorth');
  function calc() {
    var a = parseFloat(input.value) || 0;
    var earned = Math.floor(a * perLyd);
    earnedEl.textContent = earned.toLocaleString('en');
    worthEl.textContent = (Math.floor(earned / redeemPoints) * redeemValue).toLocaleString('en');
  }
  input.addEventListener('input', calc);
  calc();
})();
</script>
<?php admin_footer(); ?>
