<?php
require_once __DIR__ . '/_init.php';
require_admin();

define('PRODUCTS_PER_PAGE', 20);
define('LOW_STOCK', 5);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $id = (int)($_POST['id'] ?? 0);
    $p = $id ? qone('SELECT * FROM products WHERE id = ?', [$id]) : null;
    if ($p && $action === 'toggle') {
        q('UPDATE products SET active = 1 - active WHERE id = ?', [$id]);
        flash('تم تحديث حالة المنتج');
    } elseif ($p && $action === 'toggle_featured') {
        q('UPDATE products SET featured = 1 - featured WHERE id = ?', [$id]);
        flash('تم تحديث التمييز');
    } elseif ($p && $action === 'delete') {
        q('DELETE FROM products WHERE id = ?', [$id]);
        flash('تم حذف المنتج «' . $p['name'] . '»');
    } elseif ($p && $action === 'duplicate') {
        // نسخ المنتج بكل بياناته مع رابط فريد، ويُنشأ مخفياً وغير مميز
        $slug = $p['slug'] . '-copy';
        $n = 2;
        while (qone('SELECT id FROM products WHERE slug = ?', [$slug])) { $slug = $p['slug'] . '-copy-' . $n; $n++; }
        q('INSERT INTO products (name, slug, category_id, brand_id, description, price, old_price, stock, image, images, options, badge, featured, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)',
          [$p['name'] . ' (نسخة)', $slug, $p['category_id'], $p['brand_id'], $p['description'], $p['price'], $p['old_price'], $p['stock'], $p['image'], $p['images'], $p['options'], $p['badge']]);
        $newId = (int)db()->lastInsertId();
        foreach (get_variants($id) as $v) {
            q('INSERT INTO product_variants (product_id, label, options, price, stock, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [$newId, $v['label'], $v['options'], $v['price'], $v['stock'], $v['image'], $v['sort_order']]);
        }
        flash('تم نسخ المنتج — النسخة مخفية حتى تراجعها');
        redirect_admin('product-form.php?id=' . $newId);
    } elseif ($action === 'bulk_delete' || $action === 'bulk_update') {
        $ids = array_values(array_filter(array_map('intval', (array)($_POST['ids'] ?? [])), function ($v) { return $v > 0; }));
        $ids = array_slice(array_unique($ids), 0, 500);
        if (!$ids) { flash('لم يتم تحديد أي منتج'); redirect_admin('products.php'); }
        $in = implode(',', array_fill(0, count($ids), '?'));
        if ($action === 'bulk_delete') {
            $st = db()->prepare("DELETE FROM products WHERE id IN ($in)");
            $st->execute($ids);
            flash('تم حذف ' . $st->rowCount() . ' منتج نهائياً');
        } else {
            $map = [
                'activate' => 'UPDATE products SET active = 1',
                'hide' => 'UPDATE products SET active = 0',
                'feature' => 'UPDATE products SET featured = 1',
                'unfeature' => 'UPDATE products SET featured = 0',
            ];
            $sub = $_POST['sub'] ?? '';
            if (!isset($map[$sub])) { flash('إجراء غير معروف', true); redirect_admin('products.php'); }
            $st = db()->prepare($map[$sub] . " WHERE id IN ($in)");
            $st->execute($ids);
            flash('تم تحديث ' . $st->rowCount() . ' منتج');
        }
    }
    redirect_admin('products.php');
}

$search = trim($_GET['q'] ?? '');
$cat = (int)($_GET['cat'] ?? 0);
$brand = (int)($_GET['brand'] ?? 0);
$sort = $_GET['sort'] ?? 'new';
$stock = $_GET['stock'] ?? 'all';
$vis = $_GET['vis'] ?? 'all';
$page = max(1, (int)($_GET['page'] ?? 1));

$where = [];
$args = [];
if ($search !== '') {
    $where[] = '(p.name LIKE ? OR p.slug LIKE ? OR c.name LIKE ? OR b.name LIKE ?)';
    $like = '%' . $search . '%';
    array_push($args, $like, $like, $like, $like);
}
if ($cat) { $where[] = 'p.category_id = ?'; $args[] = $cat; }
if ($brand) { $where[] = 'p.brand_id = ?'; $args[] = $brand; }
if ($vis === 'active') $where[] = 'p.active = 1';
if ($vis === 'hidden') $where[] = 'p.active = 0';
if ($stock === 'low') { $where[] = 'p.stock > 0 AND p.stock <= ' . LOW_STOCK; }
if ($stock === 'out') $where[] = 'p.stock = 0';
$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$orderSql = match ($sort) {
    'sold' => 'sold DESC, p.id DESC',
    'stock' => 'p.stock ASC, p.id DESC',
    'price' => 'p.price DESC, p.id DESC',
    default => 'p.id DESC',
};

$baseSql = "FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN (
    SELECT oi.product_id, SUM(oi.qty) AS sold, SUM(oi.qty * oi.price) AS revenue
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'cancelled' AND oi.product_id IS NOT NULL
    GROUP BY oi.product_id
  ) sl ON sl.product_id = p.id
  $whereSql";

$total = (int)(qone("SELECT COUNT(*) AS n $baseSql", $args)['n'] ?? 0);
$pages = max(1, (int)ceil($total / PRODUCTS_PER_PAGE));
$page = min($page, $pages);
$products = qall("SELECT p.*, c.name AS cat, b.name AS brand, COALESCE(sl.sold, 0) AS sold, COALESCE(sl.revenue, 0) AS revenue $baseSql ORDER BY $orderSql LIMIT " . PRODUCTS_PER_PAGE . ' OFFSET ' . (($page - 1) * PRODUCTS_PER_PAGE), $args);

$stats = qone('SELECT COUNT(*) AS total,
  SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) AS hidden,
  SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) AS out_of_stock,
  SUM(CASE WHEN stock > 0 AND stock <= ' . LOW_STOCK . ' THEN 1 ELSE 0 END) AS low,
  COALESCE(SUM(stock * price), 0) AS stock_value
  FROM products');

$cats = qall('SELECT id, name FROM categories ORDER BY sort_order, name');

$params = ['q' => $search, 'cat' => $cat ?: '', 'sort' => $sort === 'new' ? '' : $sort, 'stock' => $stock === 'all' ? '' : $stock, 'vis' => $vis === 'all' ? '' : $vis, 'page' => $page > 1 ? $page : ''];
function products_link(array $params, array $patch): string {
    $p = array_merge($params, $patch);
    if (!isset($patch['page'])) unset($p['page']);
    $p = array_filter($p, function ($v) { return $v !== '' && $v !== null; });
    return 'products.php' . ($p ? '?' . http_build_query($p) : '');
}

$chips = [
    ['k' => 'vis', 'v' => '', 'label' => 'الكل (' . (int)$stats['total'] . ')'],
    ['k' => 'vis', 'v' => 'active', 'label' => 'ظاهر (' . ((int)$stats['total'] - (int)$stats['hidden']) . ')'],
    ['k' => 'vis', 'v' => 'hidden', 'label' => 'مخفي (' . (int)$stats['hidden'] . ')'],
    ['k' => 'stock', 'v' => 'low', 'label' => 'مخزون منخفض (' . (int)$stats['low'] . ')'],
    ['k' => 'stock', 'v' => 'out', 'label' => 'نفذ (' . (int)$stats['out_of_stock'] . ')'],
];
$chipOn = function (array $c) use ($vis, $stock): bool {
    return $c['k'] === 'vis' ? ($vis === $c['v'] || ($c['v'] === '' && $vis === 'all' && $stock === 'all')) : $stock === $c['v'];
};

admin_header('المنتجات', 'products.php');
?>
<div class="flex flex-wrap items-center justify-between gap-3">
  <div>
    <h1 class="text-2xl font-black sm:text-3xl">المنتجات</h1>
    <p class="mt-1 text-sm text-neutral-500"><?= (int)$stats['total'] ?> منتج<?= $stats['hidden'] ? ' · ' . (int)$stats['hidden'] . ' مخفي' : '' ?><?= $stats['out_of_stock'] ? ' · ' . (int)$stats['out_of_stock'] . ' نفذ مخزونه' : '' ?></p>
  </div>
  <a href="<?= e(admin_url('product-form.php')) ?>" class="admin-btn"><?= icon('plus', 16) ?> منتج جديد</a>
</div>
<?php admin_msg(); ?>
<form id="products-filters" class="mt-6 flex flex-wrap gap-2" method="get">
  <input id="products-search" name="q" value="<?= e($search) ?>" placeholder="ابحث بالاسم، الـ slug، التصنيف أو الماركة…" autocomplete="off" class="admin-input !w-full max-w-md !px-4 !py-3">
  <select name="cat" class="admin-input !w-auto !px-3 !py-3 !font-bold">
    <option value="">كل التصنيفات</option>
    <?php foreach ($cats as $c): ?><option value="<?= (int)$c['id'] ?>" <?= $cat === (int)$c['id'] ? 'selected' : '' ?>><?= e($c['name']) ?></option><?php endforeach; ?>
  </select>
  <select name="sort" class="admin-input !w-auto !px-3 !py-3 !font-bold">
    <option value="new" <?= $sort === 'new' ? 'selected' : '' ?>>ترتيب: الأحدث</option>
    <option value="sold" <?= $sort === 'sold' ? 'selected' : '' ?>>الأكثر مبيعاً</option>
    <option value="price" <?= $sort === 'price' ? 'selected' : '' ?>>السعر: الأعلى</option>
    <option value="stock" <?= $sort === 'stock' ? 'selected' : '' ?>>المخزون: الأقل</option>
  </select>
  <?php if ($stock !== 'all'): ?><input type="hidden" name="stock" value="<?= e($stock) ?>"><?php endif; ?>
  <?php if ($vis !== 'all'): ?><input type="hidden" name="vis" value="<?= e($vis) ?>"><?php endif; ?>
</form>
<script>
(function(){
  var form = document.getElementById('products-filters');
  var q = document.getElementById('products-search');
  if (!form || !q) return;
  var timer = null;
  function submitNow(){ var p = form.querySelector('input[name="page"]'); if (p) p.remove(); form.submit(); }
  q.addEventListener('input', function(){ clearTimeout(timer); timer = setTimeout(submitNow, 350); });
  form.querySelectorAll('select').forEach(function(s){ s.addEventListener('change', submitNow); });
  if (new URLSearchParams(location.search).has('q')) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
})();
</script>
<div class="mt-4 flex flex-wrap gap-2">
  <?php foreach ($chips as $c): ?>
    <a href="<?= e(products_link($params, [$c['k'] => $c['v']])) ?>" class="rounded-full px-4 py-2 text-xs font-bold transition <?= $chipOn($c) ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 shadow-sm hover:bg-neutral-100' ?>"><?= e($c['label']) ?></a>
  <?php endforeach; ?>
</div>
<p class="mt-4 text-xs text-neutral-500">عرض <?= count($products) ?> من <?= $total ?> منتجاً<?= ($search !== '' || $cat) ? ' (مفلترة)' : '' ?> · إجمالي قيمة المخزون <?= e(format_price((float)$stats['stock_value'])) ?></p>

<!-- بطاقات الجوال -->
<div class="mt-4 space-y-3 lg:hidden">
  <?php foreach ($products as $p): ?>
  <div class="admin-card p-4 <?= $p['active'] ? '' : 'opacity-60' ?>">
    <div class="flex items-start gap-3">
      <input type="checkbox" class="js-bulk mt-2 h-4 w-4" value="<?= (int)$p['id'] ?>" title="تحديد">
      <img src="<?= e(img_url($p['image'])) ?>" class="h-16 w-16 shrink-0 rounded-2xl bg-neutral-100 object-cover" alt="">
      <div class="min-w-0 flex-1">
        <a href="<?= e(admin_url('product-form.php?id=' . (int)$p['id'])) ?>" class="block truncate font-bold hover:text-violet-700"><?= e($p['name']) ?></a>
        <p class="mt-0.5 flex items-center gap-1 text-xs text-neutral-400"><?=icon('star',11,'text-amber-400')?> <?=number_format((float)$p['rating'],1)?><?php if($p['badge']): ?><span class="mr-1 rounded bg-neutral-100 px-1.5 py-0.5"><?=e($p['badge'])?></span><?php endif; ?></p>
        <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span class="font-extrabold"><?= e(format_price((float)$p['price'])) ?></span>
          <span class="rounded-full px-2.5 py-0.5 text-xs font-extrabold <?= $p['stock'] == 0 ? 'bg-red-100 text-red-600' : ($p['stock'] <= LOW_STOCK ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700') ?>"><?= (int)$p['stock'] ?></span>
          <span class="text-xs text-neutral-400">بيع <?= (int)$p['sold'] ?></span>
        </div>
      </div>
    </div>
    <div class="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
      <div class="flex items-center gap-2">
        <span class="text-[11px] font-bold text-neutral-500">ظاهر</span><form method="post" class="inline"><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= (int)$p['id'] ?>"><button class="relative h-6 w-11 rounded-full transition <?= $p['active'] ? 'bg-emerald-500' : 'bg-neutral-300' ?>" title="إظهار/إخفاء"><span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" style="inset-inline-start:<?=$p['active']?'calc(100% - 22px)':'2px'?>"></span></button></form>
        <form method="post" class="inline"><input type="hidden" name="action" value="toggle_featured"><input type="hidden" name="id" value="<?= (int)$p['id'] ?>"><button class="relative h-6 w-11 rounded-full transition <?= $p['featured'] ? 'bg-emerald-500' : 'bg-neutral-300' ?>" title="تمييز"><span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" style="inset-inline-start:<?=$p['featured']?'calc(100% - 22px)':'2px'?>"></span></button></form>
      </div>
      <div class="flex items-center gap-2">
        <a href="<?= e(admin_url('product-form.php?id=' . (int)$p['id'])) ?>" class="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white" title="تعديل"><?= icon('edit', 17) ?></a>
        <form method="post" class="inline" onsubmit="return confirm('نسخ المنتج بكل بياناته؟')"><input type="hidden" name="action" value="duplicate"><input type="hidden" name="id" value="<?= (int)$p['id'] ?>"><button class="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white" title="نسخ المنتج"><?= icon('copy', 17) ?></button></form>
        <a href="<?=e(url('product.php?slug='.rawurlencode($p['slug'])))?>" target="_blank" class="inline-grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white" title="عرض"><?=icon('eye',17)?></a>
        <form method="post" class="inline" onsubmit="return confirm('حذف المنتج نهائياً؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$p['id'] ?>"><button class="inline-grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-600 hover:text-white" title="حذف"><?= icon('trash', 17) ?></button></form>
      </div>
    </div>
  </div>
  <?php endforeach; ?>
  <?php if (!$products): ?><p class="admin-card p-8 text-center text-sm font-bold text-neutral-400">لا توجد منتجات مطابقة</p><?php endif; ?>
</div>

<!-- جدول سطح المكتب -->
<div class="admin-card mt-4 hidden overflow-x-auto p-4 lg:block">
  <table class="admin-table w-full min-w-[960px]">
    <thead><tr><th class="w-8"><input type="checkbox" class="js-bulk-all" title="تحديد الكل"></th><th>المنتج</th><th>التصنيف</th><th>السعر</th><th>المخزون</th><th>المبيعات</th><th>مميز</th><th>ظاهر</th><th>إجراءات</th></tr></thead>
    <tbody>
    <?php foreach ($products as $p): ?>
      <tr class="js-product-row <?= $p['active'] ? '' : 'opacity-50' ?>">
        <td><input type="checkbox" class="js-bulk" value="<?= (int)$p['id'] ?>" title="تحديد"></td>
        <td><div class="flex items-center gap-3"><img src="<?= e(img_url($p['image'])) ?>" class="h-12 w-12 rounded-xl bg-neutral-100 object-cover" alt=""><div class="min-w-0"><a href="<?= e(admin_url('product-form.php?id=' . (int)$p['id'])) ?>" class="line-clamp-1 font-bold hover:text-violet-700"><?= e($p['name']) ?></a><p class="flex items-center gap-1 text-xs text-neutral-400"><?=icon('star',11,'text-amber-400')?> <?=number_format((float)$p['rating'],1)?><?php if($p['badge']): ?><span class="mr-1 rounded bg-neutral-100 px-1.5 py-0.5"><?=e($p['badge'])?></span><?php endif; ?></p></div></div></td>
        <td><?= e($p['cat'] ?? '—') ?></td>
        <td class="font-bold"><?= e(format_price((float)$p['price'])) ?><?php if ($p['old_price']): ?><span class="block text-xs font-normal text-neutral-400 line-through"><?= e(format_price((float)$p['old_price'])) ?></span><?php endif; ?></td>
        <td><span class="rounded-full px-2.5 py-1 text-xs font-extrabold <?= $p['stock'] == 0 ? 'bg-red-100 text-red-600' : ($p['stock'] <= LOW_STOCK ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700') ?>"><?= (int)$p['stock'] ?></span></td>
        <td><span class="font-extrabold"><?= (int)$p['sold'] ?></span><?php if ($p['revenue'] > 0): ?><span class="block text-xs font-normal text-neutral-400"><?= e(format_price((float)$p['revenue'])) ?></span><?php endif; ?></td>
        <td><form method="post" class="inline"><input type="hidden" name="action" value="toggle_featured"><input type="hidden" name="id" value="<?= (int)$p['id'] ?>"><button class="relative h-6 w-11 rounded-full transition <?= $p['featured'] ? 'bg-emerald-500' : 'bg-neutral-300' ?>" title="تمييز"><span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" style="inset-inline-start:<?=$p['featured']?'calc(100% - 22px)':'2px'?>"></span></button></form></td>
        <td><form method="post" class="inline"><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= (int)$p['id'] ?>"><button class="relative h-6 w-11 rounded-full transition <?= $p['active'] ? 'bg-emerald-500' : 'bg-neutral-300' ?>" title="إظهار/إخفاء"><span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" style="inset-inline-start:<?=$p['active']?'calc(100% - 22px)':'2px'?>"></span></button></form></td>
        <td class="whitespace-nowrap"><div class="flex gap-2">
          <a href="<?= e(admin_url('product-form.php?id=' . (int)$p['id'])) ?>" class="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white" title="تعديل"><?= icon('edit', 15) ?></a>
        <form method="post" class="inline" onsubmit="return confirm('نسخ المنتج بكل بياناته؟')"><input type="hidden" name="action" value="duplicate"><input type="hidden" name="id" value="<?= (int)$p['id'] ?>"><button class="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white" title="نسخ المنتج"><?= icon('copy', 15) ?></button></form>
          <a href="<?=e(url('product.php?slug='.rawurlencode($p['slug'])))?>" target="_blank" class="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 transition hover:bg-black hover:text-white" title="عرض"><?=icon('eye',15)?></a>
          <form method="post" class="inline" onsubmit="return confirm('حذف المنتج نهائياً؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$p['id'] ?>"><button class="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-600 hover:text-white" title="حذف"><?= icon('trash', 15) ?></button></form>
</div></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$products): ?><tr><td colspan="10" class="py-10 text-center text-neutral-400">لا توجد منتجات مطابقة</td></tr><?php endif; ?>
    </tbody>
  </table>
</div>

<?php if ($pages > 1): ?>
<div class="mt-4 flex items-center justify-center gap-2 text-sm font-bold">
  <?php if ($page > 1): ?><a href="<?= e(products_link($params, ['page' => $page - 1])) ?>" class="rounded-full bg-white px-4 py-2 shadow-sm transition hover:bg-neutral-100">السابق</a><?php endif; ?>
  <span class="text-neutral-500">صفحة <?= $page ?> من <?= $pages ?></span>
  <?php if ($page < $pages): ?><a href="<?= e(products_link($params, ['page' => $page + 1])) ?>" class="rounded-full bg-white px-4 py-2 shadow-sm transition hover:bg-neutral-100">التالي</a><?php endif; ?>
</div>
<?php endif; ?>

<form method="post" id="bulk-form" style="display:none"><input type="hidden" name="action" value=""><input type="hidden" name="sub" value=""><span id="bulk-ids"></span></form>
<div id="bulk-bar" style="display:none" class="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 items-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-xs font-bold text-white shadow-2xl">
  <span class="px-1">تم تحديد <span id="bulk-count">0</span></span>
  <button type="button" data-bulk="activate" class="rounded-full bg-white/10 px-3 py-1.5 transition hover:bg-white/20">إظهار</button>
  <button type="button" data-bulk="hide" class="rounded-full bg-white/10 px-3 py-1.5 transition hover:bg-white/20">إخفاء</button>
  <button type="button" data-bulk="feature" class="rounded-full bg-white/10 px-3 py-1.5 transition hover:bg-white/20">تمييز</button>
  <button type="button" data-bulk="unfeature" class="rounded-full bg-white/10 px-3 py-1.5 transition hover:bg-white/20">إلغاء التمييز</button>
  <button type="button" id="bulk-open" class="rounded-full bg-red-500 px-3.5 py-1.5 transition hover:bg-red-600">حذف</button>
  <button type="button" id="bulk-clear" class="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition hover:bg-white/20" title="إلغاء التحديد">✕</button>
</div>
<div id="bulk-modal" style="display:none" class="fixed inset-0 z-50 place-items-center bg-black/50 p-4">
  <div class="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
    <h2 id="bulk-title" class="text-lg font-black"></h2>
    <p class="mt-2 text-sm leading-relaxed text-neutral-500">سيتم حذف المنتجات المحددة نهائياً ولا يمكن التراجع. الطلبات السابقة تبقى محفوظة ولن تتأثر.</p>
    <div class="mt-5 flex gap-2">
      <button type="button" id="bulk-confirm" class="flex-1 rounded-full bg-red-500 py-3 font-bold text-white transition hover:bg-red-600">تأكيد الحذف</button>
      <button type="button" id="bulk-cancel" class="flex-1 rounded-full bg-neutral-100 py-3 font-bold transition hover:bg-neutral-200">إلغاء</button>
    </div>
  </div>
</div>
<script>
(function () {
  var bar = document.getElementById('bulk-bar'), modal = document.getElementById('bulk-modal');
  function boxes() { return Array.prototype.slice.call(document.querySelectorAll('.js-bulk')); }
  function checkedCount() { return boxes().filter(function (cb) { return cb.checked; }).length; }
  function sync() {
    var n = checkedCount();
    bar.style.display = n ? 'flex' : 'none';
    document.getElementById('bulk-count').textContent = n;
    var all = document.querySelector('.js-bulk-all'), b = document.querySelectorAll('.js-bulk');
    if (all && b.length) all.checked = Array.prototype.every.call(b, function (cb) { return cb.checked; });
  }
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.classList && t.classList.contains('js-bulk-all')) {
      boxes().forEach(function (cb) { cb.checked = t.checked; });
    } else if (!(t.classList && t.classList.contains('js-bulk'))) { return; }
    sync();
  });
  function submitBulk(action, sub) {
    var form = document.getElementById('bulk-form');
    form.querySelector('input[name=action]').value = action;
    form.querySelector('input[name=sub]').value = sub || '';
    var holder = document.getElementById('bulk-ids'); holder.innerHTML = '';
    document.querySelectorAll('.js-bulk:checked').forEach(function (cb) {
      var i = document.createElement('input'); i.type = 'hidden'; i.name = 'ids[]'; i.value = cb.value; holder.appendChild(i);
    });
    form.submit();
  }
  document.querySelectorAll('[data-bulk]').forEach(function (btn) {
    btn.addEventListener('click', function () { submitBulk('bulk_update', btn.getAttribute('data-bulk')); });
  });
  document.getElementById('bulk-open').addEventListener('click', function () {
    document.getElementById('bulk-title').textContent = 'حذف ' + checkedCount() + ' منتج نهائياً؟';
    modal.style.display = 'grid';
  });
  document.getElementById('bulk-cancel').addEventListener('click', function () { modal.style.display = 'none'; });
  document.getElementById('bulk-clear').addEventListener('click', function () {
    document.querySelectorAll('.js-bulk, .js-bulk-all').forEach(function (cb) { cb.checked = false; }); sync();
  });
  document.getElementById('bulk-confirm').addEventListener('click', function () { submitBulk('bulk_delete'); });
  sync();
})();
</script>
<?php admin_footer(); ?>
