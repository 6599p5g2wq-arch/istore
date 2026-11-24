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
$page_title = $activeCat ? $activeCat['name'] : ($offers ? 'العروض والتخفيضات' : 'كل المنتجات');

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

  <div class="mt-8">
    <div class="flex flex-wrap items-center gap-2">
      <a href="<?= e(filter_url(['category'=>''])) ?>" class="rounded-full px-4 py-2 text-sm font-bold transition <?= $cat===''?'bg-white text-black':'bg-[var(--chip)] text-[var(--text)] hover:bg-[var(--chip-hover)]' ?>">الكل</a>
      <?php foreach($cats as $c): ?><a href="<?=e(filter_url(['category'=>$c['slug']]))?>" class="rounded-full px-4 py-2 text-sm font-bold transition <?=$cat===$c['slug']?'bg-white text-black':'bg-[var(--chip)] text-[var(--text)] hover:bg-[var(--chip-hover)]'?>"><?=e($c['name'])?></a><?php endforeach; ?>
      <div class="mr-auto flex max-w-full flex-wrap items-center gap-2">
        <button id="filters-toggle" type="button" aria-expanded="false" onclick="var p=document.getElementById('extra-filters'),open=p.classList.toggle('hidden');this.setAttribute('aria-expanded',String(!open));this.classList.toggle('bg-[var(--accent)]',!open);this.classList.toggle('text-white',!open);this.classList.toggle('bg-[var(--chip)]',open)" class="flex items-center gap-1.5 rounded-full bg-[var(--chip)] px-4 py-2 text-sm font-bold text-[var(--text)] transition hover:bg-[var(--chip-hover)]"><?=icon('sliders',15)?> فلاتر</button>
        <?php foreach(['brand','sort'] as $select): ?>
        <select onchange="location.href=this.value" class="min-w-0 max-w-full rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--text)] outline-none">
          <?php if($select==='brand'): ?><option value="<?=e(filter_url(['brand'=>'']))?>">كل الماركات</option><?php foreach($brands as $b): ?><option value="<?=e(filter_url(['brand'=>$b['slug']]))?>" <?=$brand===$b['slug']?'selected':''?>><?=e($b['name'])?></option><?php endforeach; ?>
          <?php else: foreach(['newest'=>'الأحدث','price-asc'=>'السعر: من الأقل','price-desc'=>'السعر: من الأعلى','name'=>'الاسم'] as $k=>$label): ?><option value="<?=e(filter_url(['sort'=>$k]))?>" <?=$sortKey===$k?'selected':''?>><?=e($label)?></option><?php endforeach; endif; ?>
        </select><?php endforeach; ?>
      </div>
    </div>
    <div id="extra-filters" class="mt-4 hidden flex flex-wrap items-end gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <?php foreach(['min'=>'أقل سعر','max'=>'أعلى سعر'] as $k=>$label): ?><label class="text-sm font-bold text-[var(--text)]"><?=e($label)?><input type="number" min="0" value="<?=e($_GET[$k]??'')?>" placeholder="<?=$k==='min'?'0':'بدون حد'?>" onblur="if(this.value===this.defaultValue)return;var u=new URL(location.href);this.value?u.searchParams.set('<?=$k?>',this.value):u.searchParams.delete('<?=$k?>');location.href=u.href" class="mt-1 block w-32 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"></label><?php endforeach; ?>
      <label class="flex cursor-pointer items-center gap-2 text-sm font-bold text-[var(--text)]"><input type="checkbox" <?=$offers?'checked':''?> onchange="location.href=this.checked?<?=e(json_encode(filter_url(['offers'=>'1'])))?>:<?=e(json_encode(filter_url(['offers'=>''])))?>" class="h-4 w-4 accent-[var(--accent)]">العروض فقط</label>
      <a href="<?=e(url('products.php'))?>" class="flex items-center gap-1 rounded-full bg-[var(--chip)] px-4 py-2 text-sm font-bold text-red-400 hover:bg-[var(--chip-hover)]"><?=icon('x',14)?> مسح الفلاتر</a>
    </div>
  </div>
  <script>try{if(sessionStorage.getItem('istore-filters-open')==='1')document.getElementById('filters-toggle').click();document.getElementById('filters-toggle').addEventListener('click',function(){sessionStorage.setItem('istore-filters-open',String(this.getAttribute('aria-expanded')==='true'?1:0));});}catch(e){}</script>

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
