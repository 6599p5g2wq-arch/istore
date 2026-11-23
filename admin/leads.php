<?php
require_once __DIR__ . '/_init.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = (int)($_POST['id'] ?? 0);
    $action = $_POST['action'] ?? '';
    if ($action === 'reminded' && $id) { q('UPDATE cart_leads SET reminded = 1 - reminded WHERE id = ?', [$id]); flash('تم تحديث حالة المتابعة'); }
    if ($action === 'delete' && $id) { q('DELETE FROM cart_leads WHERE id = ?', [$id]); flash('تم الحذف'); }
    if ($action === 'purge') {
        $cutoff = date('Y-m-d H:i:s', time() - 30 * 86400);
        $n = q('DELETE FROM cart_leads WHERE updated_at < ?', [$cutoff])->rowCount();
        flash($n ? "تم حذف $n سلة قديمة" : 'لا توجد سلات أقدم من 30 يوماً', !$n);
    }
    redirect_admin('leads.php');
}
$leads = qall('SELECT * FROM cart_leads ORDER BY updated_at DESC LIMIT 300');
$customers = qall('SELECT id, name, phone FROM customers');
$byPhone = [];
foreach ($customers as $c) $byPhone[preg_replace('/\D+/', '', $c['phone'])] = $c;
$recStmt = null;
$enriched = [];
foreach ($leads as $l) {
    $digits = preg_replace('/\D+/', '', $l['phone']);
    $cust = $byPhone[$digits] ?? null;
    $rec = qone("SELECT id, total FROM orders WHERE (REPLACE(phone, ' ', '') = ? OR phone = ?) AND status != 'cancelled' AND created_at > ? ORDER BY created_at ASC LIMIT 1", [$digits, $l['phone'], $l['updated_at']]);
    $l['customer_id'] = $cust['id'] ?? null;
    $l['customer_name'] = $cust['name'] ?? null;
    $l['recovered'] = (bool)$rec;
    $l['recovered_total'] = $rec ? (float)$rec['total'] : 0;
    $enriched[] = $l;
}
$active = array_filter($enriched, fn($l) => !$l['recovered']);
$statsValue = array_sum(array_map(fn($l) => (float)$l['total'], $active));
$statsRecovered = count(array_filter($enriched, fn($l) => $l['recovered']));
$statsRecoveredValue = array_sum(array_map(fn($l) => $l['recovered'] ? $l['recovered_total'] : 0, $enriched));
admin_header('السلات المهجورة', 'leads.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">السلات المهجورة</h1>
<p class="mt-1 text-sm text-neutral-500">زبائن أدخلوا رقم هاتفهم في صفحة الدفع ولم يكملوا الطلب — تواصل معهم عبر واتساب</p>
<?php admin_msg(); ?>
<div class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
  <div class="admin-card p-4"><p class="text-xs text-neutral-500">سلات مهجورة</p><p class="mt-1 text-xl font-black"><?= count($enriched) ?></p></div>
  <div class="admin-card p-4"><p class="text-xs text-neutral-500">قيمتها الإجمالية</p><p class="mt-1 text-xl font-black"><?= e(format_price($statsValue)) ?></p></div>
  <div class="admin-card p-4"><p class="text-xs text-neutral-500">سلات مسترجعة</p><p class="mt-1 text-xl font-black text-emerald-600"><?= $statsRecovered ?></p></div>
  <div class="admin-card p-4"><p class="text-xs text-neutral-500">قيمة المسترجع</p><p class="mt-1 text-xl font-black text-emerald-600"><?= e(format_price($statsRecoveredValue)) ?></p></div>
</div>
<div class="mt-4 flex flex-wrap items-center gap-2">
  <input id="leadSearch" dir="ltr" placeholder="بحث برقم الهاتف…" class="w-48 rounded-full border border-neutral-200 bg-white px-4 py-2 text-left text-sm outline-none focus:border-neutral-900">
  <?php foreach (['all' => 'الكل', 'pending' => 'لم يُتابَع', 'reminded' => 'تمت متابعته', 'recovered' => 'مسترجَع'] as $k => $label): ?>
    <button type="button" data-chip="<?= $k ?>" class="lead-chip rounded-full px-4 py-2 text-xs font-bold transition <?= $k === 'all' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500' ?>"><?= $label ?></button>
  <?php endforeach; ?>
  <select id="leadSort" class="rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-bold outline-none">
    <option value="recent">الأحدث</option>
    <option value="value">الأعلى قيمة</option>
  </select>
  <form method="post" onsubmit="return confirm('حذف كل السلات الأقدم من 30 يوماً؟')"><input type="hidden" name="action" value="purge"><button class="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-red-500 shadow-sm transition hover:bg-red-50"><?= icon('trash', 13) ?> حذف الأقدم من 30 يوماً</button></form>
</div>
<div class="mt-4 space-y-3" id="leadsList">
  <?php foreach ($enriched as $l):
    $items = json_decode($l['items'], true) ?: [];
    $status = $l['recovered'] ? 'recovered' : ($l['reminded'] ? 'reminded' : 'pending');
    $itemsText = implode('، ', array_map(fn($i) => ($i['name'] ?? '') . ' × ' . ($i['qty'] ?? 1), $items));
    $waMsg = 'مرحباً' . ($l['customer_name'] ? ' ' . $l['customer_name'] : '') . ' 👋 لاحظنا أنك لم تكمل طلبك من ' . setting('store_name', 'متجرنا') . ': ' . $itemsText . ' — الإجمالي ' . format_price((float)$l['total']) . '. هل نساعدك في إتمامه؟';
  ?>
    <div class="lead-card admin-card p-5 <?= $l['recovered'] ? 'border border-emerald-200' : '' ?>" data-status="<?= $status ?>" data-phone="<?= e(preg_replace('/\D+/', '', $l['phone'])) ?>" data-total="<?= (float)$l['total'] ?>" data-updated="<?= e($l['updated_at']) ?>">
      <div class="flex flex-wrap items-center gap-4">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-100 text-orange-600"><?= icon('shopping-cart', 19) ?></span>
        <button type="button" class="lead-toggle min-w-0 flex-1 text-right">
          <p class="flex flex-wrap items-center gap-2 font-extrabold">
            <span dir="ltr"><?= e($l['phone']) ?></span>
            <?php if ($l['customer_name']): ?><a href="<?= e(admin_url('customer.php?id=' . (int)$l['customer_id'])) ?>" class="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 hover:bg-sky-200"><?= e($l['customer_name']) ?></a><?php endif; ?>
            <?php if ($l['recovered']): ?><span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">استُرجعت</span>
            <?php elseif ($l['reminded']): ?><span class="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-500">تم التذكير</span><?php endif; ?>
          </p>
          <p class="mt-0.5 truncate text-xs text-neutral-500"><?= e($itemsText) ?></p>
          <p class="text-xs text-neutral-400"><?= e(format_date($l['updated_at'])) ?> — <?= e(format_price((float)$l['total'])) ?></p>
        </button>
        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <a href="tel:<?= e($l['phone']) ?>" title="اتصال" class="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-neutral-900 hover:text-neutral-900"><?= icon('phone', 15) ?></a>
          <?php if (!$l['recovered']): ?>
            <a href="https://wa.me/<?= e(preg_replace('/\D+/', '', preg_replace('/^0/', '218', $l['phone']))) ?>?text=<?= rawurlencode($waMsg) ?>" target="_blank" rel="noopener" class="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-600"><?= icon('whatsapp', 14) ?> تذكير واتساب</a>
          <?php endif; ?>
          <?php if (!$l['recovered']): ?>
            <form method="post"><input type="hidden" name="action" value="reminded"><input type="hidden" name="id" value="<?= (int)$l['id'] ?>">
              <button title="<?= $l['reminded'] ? 'التراجع عن التذكير' : 'تعليم كمُتابَعة' ?>" class="grid h-9 w-9 place-items-center rounded-full border <?= $l['reminded'] ? 'border-emerald-300 text-emerald-600' : 'border-neutral-200 text-neutral-500' ?> transition hover:border-neutral-900"><?= icon($l['reminded'] ? 'x' : 'check', 15) ?></button>
            </form>
          <?php endif; ?>
          <button type="button" class="lead-toggle grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-neutral-900 hover:text-neutral-900"><?= icon('chevron-down', 15) ?></button>
          <form method="post" onsubmit="return confirm('حذف؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$l['id'] ?>"><button class="grid h-9 w-9 place-items-center rounded-full text-neutral-400 transition hover:text-red-600"><?= icon('trash', 16) ?></button></form>
        </div>
      </div>
      <div class="lead-details mt-4 hidden rounded-2xl bg-neutral-50 p-4">
        <table class="w-full text-sm">
          <thead><tr class="text-right text-xs text-neutral-400"><th class="pb-1 font-bold">المنتج</th><th class="pb-1 font-bold">الكمية</th><th class="pb-1 font-bold">السعر</th><th class="pb-1 font-bold">الإجمالي</th></tr></thead>
          <tbody>
            <?php foreach ($items as $i): ?>
              <tr class="border-t border-neutral-200/60">
                <td class="py-1.5 font-bold"><?= e($i['name'] ?? '') ?></td>
                <td class="py-1.5"><?= (int)($i['qty'] ?? 1) ?></td>
                <td class="py-1.5"><?= e(format_price((float)($i['price'] ?? 0))) ?></td>
                <td class="py-1.5 font-bold"><?= e(format_price((float)($i['price'] ?? 0) * (int)($i['qty'] ?? 1))) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  <?php endforeach; ?>
  <?php if (!$enriched): ?><div class="admin-card py-16 text-center text-neutral-400">لا توجد سلات مهجورة</div><?php endif; ?>
  <p id="noLeadResults" class="admin-card hidden py-10 text-center text-sm text-neutral-400">لا نتائج مطابقة</p>
</div>
<script>
(function () {
  var chip = 'all';
  var search = document.getElementById('leadSearch');
  var sortSel = document.getElementById('leadSort');
  var list = document.getElementById('leadsList');
  var chips = document.querySelectorAll('.lead-chip');
  var empty = document.getElementById('noLeadResults');
  function cards() { return Array.prototype.slice.call(list.querySelectorAll('.lead-card')); }
  function apply() {
    var q = (search.value || '').replace(/\D+/g, '');
    var shown = 0;
    cards().forEach(function (c) {
      var ok = (chip === 'all' || c.dataset.status === chip) && (!q || c.dataset.phone.indexOf(q) !== -1);
      c.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    if (empty) empty.classList.toggle('hidden', shown !== 0 || cards().length === 0);
  }
  chips.forEach(function (b) {
    b.addEventListener('click', function () {
      chip = b.dataset.chip;
      chips.forEach(function (x) { x.className = 'lead-chip rounded-full px-4 py-2 text-xs font-bold transition ' + (x === b ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500'); });
      apply();
    });
  });
  if (search) search.addEventListener('input', apply);
  if (sortSel) sortSel.addEventListener('change', function () {
    var byValue = sortSel.value === 'value';
    cards().sort(function (a, b) {
      return byValue ? parseFloat(b.dataset.total) - parseFloat(a.dataset.total) : b.dataset.updated.localeCompare(a.dataset.updated);
    }).forEach(function (c) { list.insertBefore(c, empty); });
  });
  document.querySelectorAll('.lead-toggle').forEach(function (b) {
    b.addEventListener('click', function () {
      var card = b.closest('.lead-card');
      var d = card.querySelector('.lead-details');
      if (d) d.classList.toggle('hidden');
    });
  });
})();
</script>
<?php admin_footer(); ?>
