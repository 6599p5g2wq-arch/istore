<?php
require_once __DIR__ . '/_init.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = (int)($_POST['id'] ?? 0);
    $action = $_POST['action'] ?? '';
    if ($action === 'notified' && $id) { q('UPDATE stock_alerts SET notified = 1 WHERE id = ?', [$id]); flash('تم التعليم كمُشعَر'); }
    if ($action === 'delete' && $id) { q('DELETE FROM stock_alerts WHERE id = ?', [$id]); flash('تم الحذف'); }
    if ($action === 'cleanup') { q('DELETE FROM stock_alerts WHERE notified = 1'); flash('تم حذف كل الطلبات المُشعَرة'); }
    redirect_admin('stock-alerts.php');
}
$alerts = qall('SELECT a.*, p.name AS product_name, p.stock, p.slug FROM stock_alerts a JOIN products p ON p.id = a.product_id ORDER BY a.notified ASC, a.id DESC LIMIT 300');
$groups = [];
foreach ($alerts as $a) {
    $pid = (int)$a['product_id'];
    if (!isset($groups[$pid])) $groups[$pid] = ['name' => $a['product_name'], 'slug' => $a['slug'], 'stock' => (int)$a['stock'], 'rows' => []];
    $groups[$pid]['rows'][] = $a;
}
$notifiedCount = count(array_filter($alerts, fn($a) => $a['notified']));
admin_header('إشعارات التوفر', 'stock-alerts.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">إشعارات التوفر</h1>
<p class="mt-1 text-sm text-neutral-500">زبائن طلبوا تنبيههم عند توفر منتج نفد — يُرسل بريد تلقائياً لمن ترك إيميله عند إعادة التخزين، وأرقام الهواتف تُشعَر يدوياً بواتساب</p>
<?php admin_msg(); ?>
<div class="mt-4 flex flex-wrap items-center gap-2">
  <input id="saSearch" placeholder="بحث بالمنتج أو جهة الاتصال…" class="w-52 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm outline-none focus:border-neutral-900">
  <?php foreach (['all' => 'الكل', 'waiting' => 'بانتظار', 'notified' => 'تم الإشعار'] as $k => $label): ?>
    <button type="button" data-chip="<?= $k ?>" class="sa-chip rounded-full px-3 py-2 text-xs font-bold transition <?= $k === 'all' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500' ?>"><?= $label ?></button>
  <?php endforeach; ?>
  <?php if ($notifiedCount > 0): ?>
  <form method="post" class="mr-auto" onsubmit="return confirm('حذف كل الطلبات المُشعَرة (<?= $notifiedCount ?>)؟')"><input type="hidden" name="action" value="cleanup"><button class="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-600 transition hover:border-red-300 hover:text-red-600"><?= icon('trash', 13) ?> حذف المُشعَرين (<?= $notifiedCount ?>)</button></form>
  <?php endif; ?>
</div>
<div class="mt-4 space-y-4" id="saList">
  <?php foreach ($groups as $pid => $g):
    $waiting = count(array_filter($g['rows'], fn($r) => !$r['notified']));
    $productUrl = url('product.php?slug=' . rawurlencode($g['slug']));
  ?>
  <div class="sa-group admin-card p-5">
    <div class="flex flex-wrap items-center gap-2 border-b border-neutral-100 pb-3">
      <span class="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-600"><?= icon('bell', 16) ?></span>
      <a href="<?= e($productUrl) ?>" target="_blank" class="font-extrabold hover:underline"><?= e($g['name']) ?></a>
      <span class="badge <?= $g['stock'] > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600' ?>"><?= $g['stock'] > 0 ? 'متوفر الآن' : 'نافد' ?></span>
      <?php if ($waiting): ?><span class="badge bg-amber-100 text-amber-700"><?= $waiting ?> بانتظار</span><?php endif; ?>
    </div>
    <div class="mt-3 space-y-2">
      <?php foreach ($g['rows'] as $a):
        $isEmail = str_contains($a['contact'], '@');
        $waPhone = preg_replace('/\D/', '', $a['contact']);
        if (str_starts_with($waPhone, '0')) $waPhone = '218' . substr($waPhone, 1);
        $waText = 'مرحباً، المنتج «' . $g['name'] . '» أصبح متوفراً الآن في المتجر 🎉' . "\n" . rtrim(setting('site_url', ''), '/') . $productUrl;
      ?>
      <div class="sa-row flex flex-wrap items-center gap-3 rounded-2xl px-3 py-2.5 <?= $a['notified'] ? 'opacity-60' : 'bg-neutral-50' ?>" data-status="<?= $a['notified'] ? 'notified' : 'waiting' ?>" data-text="<?= e(mb_strtolower($g['name'] . ' ' . $a['contact'])) ?>">
        <span class="shrink-0 <?= $isEmail ? 'text-sky-500' : 'text-emerald-500' ?>"><?= icon($isEmail ? 'mail' : 'phone', 15) ?></span>
        <span dir="ltr" class="min-w-0 flex-1 truncate text-sm font-bold"><?= e($a['contact']) ?></span>
        <span class="text-xs text-neutral-400"><?= e(format_date($a['created_at'])) ?></span>
        <span class="badge <?= $a['notified'] ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-500' ?>"><?= $a['notified'] ? 'تم الإشعار' : 'بانتظار التوفر' ?></span>
        <?php if (!$isEmail): ?>
        <a href="https://wa.me/<?= e($waPhone) ?>?text=<?= e(rawurlencode($waText)) ?>" target="_blank" rel="noreferrer" title="تذكير واتساب برسالة فيها رابط المنتج" class="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-500 hover:text-white"><?= icon('message', 14) ?></a>
        <?php endif; ?>
        <?php if (!$a['notified']): ?>
        <form method="post" class="inline"><input type="hidden" name="action" value="notified"><input type="hidden" name="id" value="<?= (int)$a['id'] ?>"><button class="rounded-full bg-neutral-900 px-3 py-1.5 text-[11px] font-bold text-white">تم الإشعار</button></form>
        <?php endif; ?>
        <form method="post" class="inline" onsubmit="return confirm('حذف؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$a['id'] ?>"><button class="text-neutral-400 hover:text-red-600"><?= icon('trash', 15) ?></button></form>
      </div>
      <?php endforeach; ?>
    </div>
  </div>
  <?php endforeach; ?>
  <?php if (!$alerts): ?><div class="admin-card py-16 text-center text-neutral-400">لا توجد طلبات إشعار حالياً</div><?php endif; ?>
  <p id="noSaResults" class="admin-card hidden py-10 text-center text-sm text-neutral-400">لا نتائج مطابقة</p>
</div>
<script>
(function () {
  var chip = 'all';
  var search = document.getElementById('saSearch');
  var chips = document.querySelectorAll('.sa-chip');
  var empty = document.getElementById('noSaResults');
  function apply() {
    var q = (search.value || '').trim().toLowerCase();
    var anyRow = false;
    document.querySelectorAll('.sa-group').forEach(function (g) {
      var shown = 0;
      g.querySelectorAll('.sa-row').forEach(function (r) {
        var ok = (chip === 'all' || r.dataset.status === chip) && (!q || r.dataset.text.indexOf(q) !== -1);
        r.style.display = ok ? '' : 'none';
        if (ok) { shown++; anyRow = true; }
      });
      g.style.display = shown ? '' : 'none';
    });
    if (empty) empty.classList.toggle('hidden', anyRow);
  }
  chips.forEach(function (b) {
    b.addEventListener('click', function () {
      chip = b.dataset.chip;
      chips.forEach(function (x) { x.className = 'sa-chip rounded-full px-3 py-2 text-xs font-bold transition ' + (x === b ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500'); });
      apply();
    });
  });
  if (search) search.addEventListener('input', apply);
})();
</script>
<?php admin_footer(); ?>
