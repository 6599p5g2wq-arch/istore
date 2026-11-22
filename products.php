<?php
require __DIR__ . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';
require APP_ROOT . '/includes/product-card.php';

$cats = categories();
$brands = qall('SELECT * FROM brands WHERE active = 1 ORDER BY sort_order');

$SORTS = [
    'newest' => 'p.created_at DESC, p.id DESC',
    'price-asc' => 'p.price ASC',
    'price-desc' => 'p.price DESC',
    'name' => 'p.name ASC',
];
$cat = trim($_GET['category'] ?? '');
$brand = trim($_GET['brand'] ?? '');
$search = trim($_GET['q'] ?? '');
$sortKey = $_GET['sort'] ?? 'newest';
$sort = $SORTS[$sortKey] ?? $SORTS['newest'];
$offers = ($_GET['offers'] ?? '') === '1';
$min = ($_GET['min'] ?? '') !== '' ? (float)$_GET['min'] : null;
$max = ($_GET['max'] ?? '') !== '' ? (float)$_GET['max'] : null;

$where = ['p.active = 1'];
$params = [];
if ($cat !== '') { $where[] = 'c.slug = ?'; $params[] = $cat; }
if ($brand !== '') { $where[] = 'b.slug = ?'; $params[] = $brand; }
if ($search !== '') { $where[] = '(p.name LIKE ? OR p.description LIKE ?)'; $params[] = "%$search%"; $params[] = "%$search%"; }
if ($offers) { $where[] = 'p.old_price IS NOT NULL AND p.old_price > p.price'; }
if ($min !== null) { $where[] = 'p.price >= ?'; $params[] = $min; }
if ($max !== null) { $where[] = 'p.price <= ?'; $params[] = $max; }

$products = qall(
    'SELECT p.*, c.name AS category_name, b.name AS brand_name, b.slug AS brand_slug FROM products p
     LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id
     WHERE ' . implode(' AND ', $where) . " ORDER BY $sort", $params);

$activeCat = null;
foreach ($cats as $c) if ($c['slug'] === $cat) $activeCat = $c;
$page_title = $activeCat ? $activeCat['name'] : ($offers ? 'العروض والتخفيضات' : ($search ? 'نتائج البحث' : 'كل المنتجات'));

function filter_url(array $over): string {
    $q = array_merge([
        'category' => $_GET['category'] ?? '', 'brand' => $_GET['brand'] ?? '', 'q' => $_GET['q'] ?? '',
        'sort' => $_GET['sort'] ?? 'newest', 'offers' => $_GET['offers'] ?? '', 'min' => $_GET['min'] ?? '', 'max' => $_GET['max'] ?? '',
    ], $over);
    $q = array_filter($q, fn($v) => $v !== '' && $v !== null);
    return url('products.php' . ($q ? ('?' . http_build_query($q)) : ''));
}

require APP_ROOT . '/includes/store-header.php';
?>
<div class="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
  <h1 class="text-3xl font-black sm:text-4xl"><?= e($page_title) ?></h1>
  <?php if ($activeCat && $activeCat['description']): ?><p class="mt-2 text-[var(--text-faint)]"><?= e($activeCat['description']) ?></p><?php endif; ?>
  <?php if ($search !== ''): ?><p class="mt-2 text-[var(--text-faint)]">نتائج البحث عن «<?= e($search) ?>»: <?= count($products) ?> منتج</p><?php endif; ?>

  <!-- الفلاتر -->
  <div class="mt-6 space-y-4">
    <div class="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      <a href="<?= e(filter_url(['category' => ''])) ?>" class="shrink-0 rounded-full px-4 py-2 text-sm font-bold transition <?= $cat === '' ? 'bg-white text-black' : 'bg-[var(--chip)] text-[var(--text)] hover:bg-[var(--chip-hover)]' ?>">الكل</a>
      <?php foreach ($cats as $c): ?>
      <a href="<?= e(filter_url(['category' => $c['slug']])) ?>" class="shrink-0 rounded-full px-4 py-2 text-sm font-bold transition <?= $cat === $c['slug'] ? 'bg-white text-black' : 'bg-[var(--chip)] text-[var(--text)] hover:bg-[var(--chip-hover)]' ?>"><?= e($c['name']) ?></a>
      <?php endforeach; ?>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <?php if ($brands): ?>
      <select onchange="location.href=this.value" class="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-bold text-[var(--text)] outline-none">
        <option value="<?= e(filter_url(['brand' => ''])) ?>">كل الماركات</option>
        <?php foreach ($brands as $b): ?>
        <option value="<?= e(filter_url(['brand' => $b['slug']])) ?>" <?= $brand === $b['slug'] ? 'selected' : '' ?>><?= e($b['name']) ?></option>
        <?php endforeach; ?>
      </select>
      <?php endif; ?>
      <select onchange="location.href=this.value" class="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-bold text-[var(--text)] outline-none">
        <option value="<?= e(filter_url(['sort' => 'newest'])) ?>" <?= $sortKey === 'newest' ? 'selected' : '' ?>>الأحدث</option>
        <option value="<?= e(filter_url(['sort' => 'price-asc'])) ?>" <?= $sortKey === 'price-asc' ? 'selected' : '' ?>>السعر: من الأقل</option>
        <option value="<?= e(filter_url(['sort' => 'price-desc'])) ?>" <?= $sortKey === 'price-desc' ? 'selected' : '' ?>>السعر: من الأعلى</option>
        <option value="<?= e(filter_url(['sort' => 'name'])) ?>" <?= $sortKey === 'name' ? 'selected' : '' ?>>الاسم</option>
      </select>
      <a href="<?= e(filter_url(['offers' => $offers ? '' : '1'])) ?>" class="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-bold transition <?= $offers ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-[var(--card)] text-[var(--text)]' ?>">
        <?= icon('tag', 15) ?> العروض فقط
      </a>
      <form action="<?= e(url('products.php')) ?>" method="get" class="flex items-center gap-2">
        <?php foreach (['category' => $cat, 'brand' => $brand, 'q' => $search, 'sort' => $sortKey, 'offers' => $offers ? '1' : ''] as $k => $v): if ($v === '' || $v === null) continue; ?>
        <input type="hidden" name="<?= e($k) ?>" value="<?= e($v) ?>">
        <?php endforeach; ?>
        <input name="min" type="number" min="0" placeholder="من" value="<?= e($_GET['min'] ?? '') ?>" class="w-20 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none">
        <input name="max" type="number" min="0" placeholder="إلى" value="<?= e($_GET['max'] ?? '') ?>" class="w-20 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none">
        <button class="rounded-xl bg-[var(--chip)] px-3 py-2 text-sm font-bold text-[var(--text)] transition hover:bg-[var(--chip-hover)]">السعر</button>
      </form>
    </div>
  </div>

  <?php if (!$products): ?>
  <div class="mt-8 grid place-items-center rounded-3xl bg-[var(--card)] py-24 text-center">
    <p class="text-lg font-bold text-[var(--text-dim)]">لا توجد منتجات مطابقة</p>
    <p class="mt-1 text-sm text-[var(--text-faint)]">جرّب تعديل الفلاتر أو البحث بكلمة أخرى</p>
  </div>
  <?php else: ?>
  <div class="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
    <?php foreach ($products as $i => $p) echo product_card($p, $i % 8); ?>
  </div>
  <?php endif; ?>
  <p class="mt-6 text-sm text-[var(--text-dim)]"><?= count($products) ?> منتج</p>
</div>
<?php require APP_ROOT . '/includes/store-footer.php'; ?>
