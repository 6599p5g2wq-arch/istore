<?php
require_once __DIR__ . '/_init.php';
require_admin();
migrate_reviews_reply(db());
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $id = (int)($_POST['id'] ?? 0);
    $r = $id ? qone('SELECT * FROM reviews WHERE id = ?', [$id]) : null;
    if ($r && $action === 'toggle') {
        q('UPDATE reviews SET approved = 1 - approved WHERE id = ?', [$id]);
        q('UPDATE products SET rating = (SELECT COALESCE(ROUND(AVG(rating), 1), rating) FROM reviews WHERE product_id = ? AND approved = 1) WHERE id = ?', [$r['product_id'], $r['product_id']]);
    } elseif ($r && $action === 'reply') {
        q('UPDATE reviews SET reply = ? WHERE id = ?', [mb_substr(trim($_POST['reply'] ?? ''), 0, 500), $id]);
        flash('تم حفظ الرد');
    } elseif ($r && $action === 'delete') {
        q('DELETE FROM reviews WHERE id = ?', [$id]);
        q('UPDATE products p SET rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = ? AND approved = 1), p.rating) WHERE id = ?', [$r['product_id'], $r['product_id']]);
        flash('تم حذف التقييم');
    }
    redirect_admin('reviews.php');
}
$reviews = qall('SELECT r.*, p.name AS product_name, p.slug FROM reviews r JOIN products p ON p.id = r.product_id ORDER BY r.id DESC LIMIT 200');
$perProduct = qall('SELECT p.id, p.name, p.slug, ROUND(AVG(r.rating), 1) AS avg, COUNT(*) AS cnt FROM reviews r JOIN products p ON p.id = r.product_id WHERE r.approved = 1 GROUP BY p.id ORDER BY avg DESC, cnt DESC');
$topProducts = array_slice($perProduct, 0, 3);
$asc = $perProduct;
usort($asc, fn($a, $b) => [(float)$a['avg'], -(int)$b['cnt']] <=> [(float)$b['avg'], -(int)$b['cnt']]);
$bottomProducts = array_slice($asc, 0, 3);
$hidden = count(array_filter($reviews, fn($r) => !$r['approved']));
$avg = $reviews ? round(array_sum(array_column($reviews, 'rating')) / count($reviews), 1) : 0;
$dist = [];
foreach ([5, 4, 3, 2, 1] as $n) $dist[$n] = count(array_filter($reviews, fn($r) => (int)$r['rating'] === $n));
$maxDist = max(1, ...array_values($dist));
admin_header('التقييمات', 'reviews.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">التقييمات</h1>
<p class="mt-1 text-sm text-neutral-500">كلها موثقة برقم طلب مستلَم — أخفِ أو احذف أي تقييم مسيء، ورُدّ على زبائنك</p>
<?php admin_msg(); ?>
<div class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
  <div class="admin-card p-4"><p class="text-xs text-neutral-500">متوسط التقييم</p><p class="mt-1 flex items-center gap-1 text-xl font-black"><?= icon('star', 17, 'fill-current text-amber-400') ?> <?= $avg ?></p></div>
  <div class="admin-card p-4"><p class="text-xs text-neutral-500">عدد التقييمات</p><p class="mt-1 text-xl font-black"><?= count($reviews) ?></p></div>
  <div class="admin-card p-4"><p class="text-xs text-neutral-500">مخفية</p><p class="mt-1 text-xl font-black"><?= $hidden ?></p></div>
  <div class="admin-card p-4">
    <p class="text-xs text-neutral-500">توزيع النجوم</p>
    <div class="mt-1.5 space-y-0.5">
      <?php foreach ($dist as $n => $cnt): ?>
        <div class="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500">
          <span class="w-2"><?= $n ?></span>
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100"><div class="h-full rounded-full bg-amber-400" style="width: <?= (int)round($cnt / $maxDist * 100) ?>%"></div></div>
          <span class="w-4 text-left"><?= $cnt ?></span>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</div>
<?php if ($perProduct): ?>
<div class="mt-4 grid gap-3 sm:grid-cols-2">
  <div class="admin-card p-4">
    <p class="text-xs font-bold text-emerald-600">أعلى المنتجات تقييماً</p>
    <?php foreach ($topProducts as $p): ?>
      <a href="<?= e(url('product.php?slug=' . rawurlencode($p['slug']))) ?>" target="_blank" class="mt-1.5 flex items-center justify-between gap-2 text-sm hover:underline">
        <span class="min-w-0 truncate font-bold"><?= e($p['name']) ?></span>
        <span class="flex shrink-0 items-center gap-1 text-xs text-neutral-500"><?= icon('star', 12, 'fill-current text-amber-400') ?><?= $p['avg'] ?> (<?= $p['cnt'] ?>)</span>
      </a>
    <?php endforeach; ?>
  </div>
  <div class="admin-card p-4">
    <p class="text-xs font-bold text-red-500">أدنى المنتجات تقييماً</p>
    <?php foreach ($bottomProducts as $p): ?>
      <a href="<?= e(url('product.php?slug=' . rawurlencode($p['slug']))) ?>" target="_blank" class="mt-1.5 flex items-center justify-between gap-2 text-sm hover:underline">
        <span class="min-w-0 truncate font-bold"><?= e($p['name']) ?></span>
        <span class="flex shrink-0 items-center gap-1 text-xs text-neutral-500"><?= icon('star', 12, 'fill-current text-amber-400') ?><?= $p['avg'] ?> (<?= $p['cnt'] ?>)</span>
      </a>
    <?php endforeach; ?>
  </div>
</div>
<?php endif; ?>
<div class="mt-4 flex flex-wrap items-center gap-2">
  <input id="revSearch" placeholder="بحث بالزبون أو المنتج…" class="w-48 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm outline-none focus:border-neutral-900">
  <?php foreach (['all' => 'الكل', 'visible' => 'معروض', 'hidden' => 'مخفي', '5' => '★★★★★', '4' => '★★★★', '3' => '★★★', '2' => '★★', '1' => '★'] as $k => $label): ?>
    <button type="button" data-chip="<?= $k ?>" class="rev-chip rounded-full px-3 py-2 text-xs font-bold transition <?= $k === 'all' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500' ?>"><?= $label ?></button>
  <?php endforeach; ?>
  <select id="revSort" class="rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-bold outline-none">
    <option value="recent">الأحدث</option>
    <option value="lowest">الأدنى تقييماً</option>
  </select>
</div>
<div class="mt-4 space-y-3" id="revList">
  <?php foreach ($reviews as $r): $status = $r['approved'] ? 'visible' : 'hidden'; ?>
    <div class="rev-card admin-card p-5 <?= $r['approved'] ? '' : 'opacity-60' ?>" data-status="<?= $status ?>" data-rating="<?= (int)$r['rating'] ?>" data-text="<?= e(mb_strtolower($r['customer_name'] . ' ' . $r['product_name'])) ?>">
      <div class="flex flex-wrap items-start gap-4">
        <div class="flex pt-1 text-amber-500"><?php for ($i = 0; $i < (int)$r['rating']; $i++) echo '★'; ?><span class="text-neutral-300"><?php for ($i = (int)$r['rating']; $i < 5; $i++) echo '★'; ?></span></div>
        <div class="min-w-0 flex-1">
          <p class="flex flex-wrap items-center gap-2 font-extrabold">
            <?= e($r['customer_name']) ?>
            <a href="<?= e(url('product.php?slug=' . rawurlencode($r['slug']))) ?>" target="_blank" class="text-xs font-bold text-sky-600 hover:underline">«<?= e($r['product_name']) ?>»</a>
            <span class="badge <?= $r['approved'] ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500' ?>"><?= $r['approved'] ? 'معروض' : 'مخفي' ?></span>
          </p>
          <?php if ($r['comment']): ?><p class="mt-1 text-sm text-neutral-600"><?= e($r['comment']) ?></p><?php endif; ?>
          <?php if (!empty($r['reply'])): ?><p class="mt-2 rounded-2xl bg-neutral-50 px-4 py-2.5 text-sm text-neutral-700"><span class="font-extrabold">رد المتجر: </span><?= e($r['reply']) ?></p><?php endif; ?>
          <form method="post" class="reply-form mt-2 hidden items-start gap-2">
            <input type="hidden" name="action" value="reply"><input type="hidden" name="id" value="<?= (int)$r['id'] ?>">
            <textarea name="reply" rows="2" maxlength="500" placeholder="اكتب ردك — سيظهر في صفحة المنتج تحت التقييم" class="admin-input min-w-0 flex-1"><?= e($r['reply'] ?? '') ?></textarea>
            <button class="admin-btn shrink-0">حفظ الرد</button>
          </form>
          <p class="mt-1 text-xs text-neutral-400" dir="ltr"><?= e($r['order_code']) ?> — <?= e($r['created_at']) ?></p>
        </div>
        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <button type="button" class="reply-toggle grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-neutral-900 hover:text-neutral-900" title="<?= !empty($r['reply']) ? 'تعديل الرد' : 'رد على التقييم' ?>"><?= icon('message', 15) ?></button>
          <form method="post"><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= (int)$r['id'] ?>"><button class="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition <?= $r['approved'] ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200' : 'bg-neutral-900 text-white' ?>"><?= $r['approved'] ? 'إخفاء' : 'عرض' ?></button></form>
          <form method="post" onsubmit="return confirm('حذف التقييم؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$r['id'] ?>"><button class="grid h-9 w-9 place-items-center rounded-full text-neutral-400 transition hover:text-red-600"><?= icon('trash', 16) ?></button></form>
        </div>
      </div>
    </div>
  <?php endforeach; ?>
  <?php if (!$reviews): ?><div class="admin-card py-16 text-center text-neutral-400">لا توجد تقييمات بعد</div><?php endif; ?>
  <p id="noRevResults" class="admin-card hidden py-10 text-center text-sm text-neutral-400">لا نتائج مطابقة</p>
</div>
<script>
(function () {
  var chip = 'all';
  var search = document.getElementById('revSearch');
  var sortSel = document.getElementById('revSort');
  var list = document.getElementById('revList');
  var chips = document.querySelectorAll('.rev-chip');
  var empty = document.getElementById('noRevResults');
  function cards() { return Array.prototype.slice.call(list.querySelectorAll('.rev-card')); }
  function apply() {
    var q = (search.value || '').trim().toLowerCase();
    var shown = 0;
    cards().forEach(function (c) {
      var ok = true;
      if (chip === 'visible' || chip === 'hidden') ok = c.dataset.status === chip;
      else if (chip !== 'all') ok = c.dataset.rating === chip;
      if (ok && q) ok = c.dataset.text.indexOf(q) !== -1;
      c.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    if (empty) empty.classList.toggle('hidden', shown !== 0 || cards().length === 0);
  }
  chips.forEach(function (b) {
    b.addEventListener('click', function () {
      chip = b.dataset.chip;
      chips.forEach(function (x) { x.className = 'rev-chip rounded-full px-3 py-2 text-xs font-bold transition ' + (x === b ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500'); });
      apply();
    });
  });
  if (search) search.addEventListener('input', apply);
  if (sortSel) sortSel.addEventListener('change', function () {
    var lowest = sortSel.value === 'lowest';
    cards().sort(function (a, b) {
      return lowest ? parseInt(a.dataset.rating) - parseInt(b.dataset.rating) : 0;
    }).forEach(function (c) { list.insertBefore(c, empty); });
  });
  document.querySelectorAll('.reply-toggle').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.closest('.rev-card').querySelector('.reply-form');
      f.classList.toggle('hidden');
      f.classList.toggle('flex');
      var t = f.querySelector('textarea');
      if (!f.classList.contains('hidden')) t.focus();
    });
  });
})();
</script>
<?php admin_footer(); ?>
