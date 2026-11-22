<?php
require_once __DIR__ . '/_init.php';
require_admin();
$id = (int)($_GET['id'] ?? 0);
$p = $id ? qone('SELECT * FROM products WHERE id = ?', [$id]) : null;
if ($id && !$p) { flash('المنتج غير موجود', true); redirect_admin('products.php'); }

function slugify_ar(string $name): string {
    $s = preg_replace('/[^\p{L}\p{N}]+/u', '-', trim($name));
    $s = trim($s, '-');
    return $s !== '' ? mb_strtolower($s) : 'product-' . substr(bin2hex(random_bytes(3)), 0, 6);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = mb_substr(trim($_POST['name'] ?? ''), 0, 300);
    $slug = trim($_POST['slug'] ?? '') ?: slugify_ar($name);
    $categoryId = (int)($_POST['category_id'] ?? 0) ?: null;
    $brandId = (int)($_POST['brand_id'] ?? 0) ?: null;
    $price = max(0, (float)($_POST['price'] ?? 0));
    $oldPrice = ($_POST['old_price'] ?? '') !== '' ? max(0, (float)$_POST['old_price']) : null;
    $stock = max(0, (int)($_POST['stock'] ?? 0));
    $badge = mb_substr(trim($_POST['badge'] ?? ''), 0, 100);
    $description = trim($_POST['description'] ?? '');
    $featured = !empty($_POST['featured']) ? 1 : 0;
    $active = !empty($_POST['active']) ? 1 : 0;
    $image = trim($_POST['image'] ?? '');
    $uploaded = handle_image_upload('image_file');
    if ($uploaded) $image = $uploaded;
    $images = array_values(array_filter(array_map('trim', explode("\n", $_POST['images'] ?? ''))));
    $options = json_encode(parse_options($_POST['options_json'] ?? ''), JSON_UNESCAPED_UNICODE);
    $variantInputs = json_decode($_POST['variants_json'] ?? '[]', true);
    if (!is_array($variantInputs)) $variantInputs = [];
    $hasVariants = count(json_decode($options, true) ?: []) > 0;
    if (!$name || $price <= 0) {
        flash('الاسم والسعر مطلوبان', true);
    } else {
        // تأكد من فرادة الرابط
        $dup = qone('SELECT id FROM products WHERE slug = ? AND id != ?', [$slug, $id]);
        if ($dup) $slug .= '-' . substr(bin2hex(random_bytes(2)), 0, 4);
        if ($p) {
            q('UPDATE products SET name=?, slug=?, category_id=?, brand_id=?, description=?, price=?, old_price=?, stock=?, image=?, images=?, options=?, badge=?, featured=?, active=? WHERE id=?',
              [$name, $slug, $categoryId, $brandId, $description, $price, $oldPrice, $stock, $image, json_encode($images, JSON_UNESCAPED_UNICODE), $options, $badge, $featured, $active, $id]);
            replace_variants($id, $options, $variantInputs);
            flash('تم حفظ التعديلات');
        } else {
            q('INSERT INTO products (name, slug, category_id, brand_id, description, price, old_price, stock, image, images, options, badge, featured, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [$name, $slug, $categoryId, $brandId, $description, $price, $oldPrice, $stock, $image, json_encode($images, JSON_UNESCAPED_UNICODE), $options, $badge, $featured, $active]);
            $newId = (int)db()->lastInsertId();
            replace_variants($newId, $options, $variantInputs);
            flash('تمت إضافة المنتج');
        }
        redirect_admin('products.php');
    }
}
$cats = qall('SELECT id, name FROM categories ORDER BY sort_order, name');
$brands = qall('SELECT id, name FROM brands ORDER BY sort_order, name');
$imagesText = $p ? implode("\n", json_decode($p['images'] ?: '[]', true) ?: []) : '';
$existingOptions = $p ? parse_options($p['options'] ?? '') : [];
$existingVariants = $p ? array_map(fn($v) => [
    'options' => json_decode($v['options'] ?: '{}', true) ?: [],
    'price' => $v['price'] !== null ? (float)$v['price'] : null,
    'stock' => (int)$v['stock'],
    'image' => (string)$v['image'],
], get_variants($p['id'])) : [];
admin_header($p ? 'تعديل منتج' : 'منتج جديد', 'products.php');
?>
<div class="flex items-center justify-between">
  <h1 class="text-2xl font-black sm:text-3xl"><?= $p ? 'تعديل: ' . e($p['name']) : 'منتج جديد' ?></h1>
  <a href="<?= e(admin_url('products.php')) ?>" class="admin-btn-ghost"><?= icon('arrow-left', 16) ?> رجوع</a>
</div>
<?php admin_msg(); ?>
<form method="post" enctype="multipart/form-data" class="mt-6 grid gap-5 lg:grid-cols-3">
  <div class="space-y-5 lg:col-span-2">
    <div class="admin-card space-y-4 p-6">
      <label class="block text-sm font-bold">اسم المنتج<input name="name" required value="<?= e($p['name'] ?? '') ?>" class="admin-input mt-1.5"></label>
      <label class="block text-sm font-bold">الرابط (slug)<input name="slug" dir="ltr" value="<?= e($p['slug'] ?? '') ?>" placeholder="يُنشأ تلقائياً إن تُرك فارغاً" class="admin-input mt-1.5 text-left"></label>
      <label class="block text-sm font-bold">الوصف<textarea name="description" rows="6" class="admin-input mt-1.5 resize-none"><?= e($p['description'] ?? '') ?></textarea></label>
    </div>
    <div class="admin-card space-y-4 p-6">
      <h2 class="font-extrabold">الصور</h2>
      <label class="block text-sm font-bold">رابط الصورة الرئيسية<input name="image" dir="ltr" value="<?= e($p['image'] ?? '') ?>" class="admin-input mt-1.5 text-left" placeholder="images/...jpg أو https://..."></label>
      <label class="block text-sm font-bold">أو رفع صورة جديدة<input type="file" name="image_file" accept="image/*" class="admin-input mt-1.5"></label>
      <label class="block text-sm font-bold">صور إضافية (رابط في كل سطر)<textarea name="images" dir="ltr" rows="4" class="admin-input mt-1.5 resize-none text-left"><?= e($imagesText) ?></textarea></label>
      <?php if ($p && $p['image']): ?><img src="<?= e(img_url($p['image'])) ?>" class="h-24 w-24 rounded-2xl object-cover" alt=""><?php endif; ?>
    </div>
    <div class="admin-card space-y-4 p-6" id="variants-card">
      <h2 class="font-extrabold">المتغيرات <span class="text-sm font-normal text-[var(--text-faint)]">(اختياري: جهاز، لون، مقاس...)</span></h2>
      <p class="text-xs text-[var(--text-faint)]">عرّف حتى 3 خيارات لكل منتج، والقيم تُفصل بفواصل. تُنشأ التوليفات تلقائياً ولكل توليفة مخزونها الخاص وسعر وصورة اختياريان. عند وجود متغيرات، مخزون المنتج الكلي يساوي مجموع مخزون التوليفات.</p>
      <div id="opt-rows" class="space-y-3"></div>
      <button type="button" id="opt-add" class="admin-btn-ghost">+ إضافة خيار</button>
      <div id="variant-combos" class="mt-4 space-y-2"></div>
      <input type="hidden" name="options_json" id="options_json">
      <input type="hidden" name="variants_json" id="variants_json">
    </div>
  </div>
  <div class="space-y-5">
    <div class="admin-card space-y-4 p-6">
      <label class="block text-sm font-bold">السعر<input name="price" type="number" step="0.01" min="0" required value="<?= e((string)($p['price'] ?? '')) ?>" class="admin-input mt-1.5"></label>
      <label class="block text-sm font-bold">السعر قبل الخصم (اختياري)<input name="old_price" type="number" step="0.01" min="0" value="<?= e((string)($p['old_price'] ?? '')) ?>" class="admin-input mt-1.5"></label>
      <label class="block text-sm font-bold">المخزون<input id="f-stock" name="stock" type="number" min="0" value="<?= e((string)($p['stock'] ?? 0)) ?>" class="admin-input mt-1.5"></label>
      <p id="stock-note" class="hidden text-xs font-bold text-amber-400">يُحسب تلقائياً من مجموع مخزون التوليفات</p>
      <label class="block text-sm font-bold">شارة (مثال: جديد، خصم)<input name="badge" value="<?= e($p['badge'] ?? '') ?>" class="admin-input mt-1.5"></label>
    </div>
    <div class="admin-card space-y-4 p-6">
      <label class="block text-sm font-bold">التصنيف<select name="category_id" class="admin-input mt-1.5"><option value="">بدون</option><?php foreach ($cats as $c): ?><option value="<?= (int)$c['id'] ?>" <?= ($p['category_id'] ?? null) == $c['id'] ? 'selected' : '' ?>><?= e($c['name']) ?></option><?php endforeach; ?></select></label>
      <label class="block text-sm font-bold">الماركة<select name="brand_id" class="admin-input mt-1.5"><option value="">بدون</option><?php foreach ($brands as $b): ?><option value="<?= (int)$b['id'] ?>" <?= ($p['brand_id'] ?? null) == $b['id'] ? 'selected' : '' ?>><?= e($b['name']) ?></option><?php endforeach; ?></select></label>
      <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="featured" <?= ($p['featured'] ?? 0) ? 'checked' : '' ?> class="h-4 w-4"> منتج مميز</label>
      <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="active" <?= ($p['active'] ?? 1) ? 'checked' : '' ?> class="h-4 w-4"> ظاهر في المتجر</label>
    </div>
    <button class="admin-btn w-full justify-center py-3.5 text-base"><?= icon('check', 18) ?> حفظ المنتج</button>
    <a href="<?= e(admin_url('products.php')) ?>" class="admin-btn-ghost w-full justify-center py-3"><?= icon('arrow-left', 16) ?> رجوع بدون حفظ</a>
  </div>
</form>
<script>
var INIT_OPTIONS = <?= json_encode($existingOptions, JSON_UNESCAPED_UNICODE) ?>;
var INIT_VARIANTS = <?= json_encode($existingVariants, JSON_UNESCAPED_UNICODE) ?>;
(function () {
  var optRows = document.getElementById('opt-rows');
  var combosBox = document.getElementById('variant-combos');
  var addBtn = document.getElementById('opt-add');
  var optState = INIT_OPTIONS.map(function (o) { return { name: o.name, values: o.values }; });

  function readRows() {
    var out = [];
    optRows.querySelectorAll('[data-opt]').forEach(function (row) {
      var name = row.querySelector('[data-opt-name]').value.trim();
      var values = row.querySelector('[data-opt-values]').value.split(',').map(function (v) { return v.trim(); }).filter(Boolean);
      if (name && values.length) out.push({ name: name, values: values });
    });
    return out.slice(0, 3);
  }

  function combos(options) {
    var acc = [{}];
    options.forEach(function (o) {
      var next = [];
      acc.forEach(function (base) { o.values.forEach(function (v) { var c = Object.assign({}, base); c[o.name] = v; next.push(c); }); });
      acc = next;
    });
    return acc;
  }

  function label(c, options) { return options.map(function (o) { return c[o.name]; }).join(' / '); }

  function currentVariantInputs() {
    var inputs = [];
    combosBox.querySelectorAll('[data-combo]').forEach(function (row) {
      inputs.push({
        options: JSON.parse(row.getAttribute('data-combo')),
        stock: Math.max(0, parseInt(row.querySelector('[data-v-stock]').value || '0', 10)),
        price: row.querySelector('[data-v-price]').value !== '' ? parseFloat(row.querySelector('[data-v-price]').value) : null,
        image: row.querySelector('[data-v-image]').value.trim()
      });
    });
    return inputs;
  }

  function renderCombos() {
    var options = readRows();
    var prev = {};
    currentVariantInputs().forEach(function (v) { prev[label(v.options, readPrevOptions(v))] = v; });
    function readPrevOptions(v) { return Object.keys(v.options).map(function (k) { return { name: k, values: [] }; }); }
    var initMap = {};
    INIT_VARIANTS.forEach(function (v) { initMap[Object.keys(v.options).map(function (k) { return v.options[k]; }).join(' / ')] = v; });
    combosBox.innerHTML = '';
    var stockInput = document.getElementById('f-stock');
    var note = document.getElementById('stock-note');
    if (!options.length) { stockInput.disabled = false; note.classList.add('hidden'); return; }
    stockInput.disabled = true; note.classList.remove('hidden');
    combos(options).forEach(function (c) {
      var l = label(c, options);
      var v = prev[l] || initMap[l] || { stock: 0, price: null, image: '' };
      var div = document.createElement('div');
      div.className = 'rounded-2xl border border-[var(--border)] p-3';
      div.setAttribute('data-combo', JSON.stringify(c));
      div.innerHTML = '<p class="mb-2 text-sm font-bold">' + l + '</p>'
        + '<div class="grid gap-2 sm:grid-cols-3">'
        + '<label class="text-xs font-bold">المخزون<input data-v-stock type="number" min="0" value="' + (v.stock || 0) + '" class="admin-input mt-1"></label>'
        + '<label class="text-xs font-bold">سعر خاص (اختياري)<input data-v-price type="number" step="0.01" min="0" value="' + (v.price === null || v.price === undefined ? '' : v.price) + '" class="admin-input mt-1"></label>'
        + '<label class="text-xs font-bold">صورة (اختياري)<input data-v-image dir="ltr" value="' + (v.image || '').replace(/"/g, '&quot;') + '" class="admin-input mt-1 text-left"></label>'
        + '</div>';
      combosBox.appendChild(div);
    });
  }

  function renderOptRows() {
    optRows.innerHTML = '';
    optState.forEach(function (o, idx) {
      var row = document.createElement('div');
      row.className = 'grid gap-2 rounded-2xl border border-[var(--border)] p-3 sm:grid-cols-[1fr_2fr_auto]';
      row.setAttribute('data-opt', '1');
      row.innerHTML = '<input data-opt-name placeholder="اسم الخيار (مثال: اللون)" value="' + o.name.replace(/"/g, '&quot;') + '" class="admin-input">'
        + '<input data-opt-values placeholder="القيم مفصولة بفواصل: أسود, أبيض, أزرق" value="' + o.values.join(', ').replace(/"/g, '&quot;') + '" class="admin-input">'
        + '<button type="button" class="admin-btn-ghost" data-opt-remove>حذف</button>';
      row.querySelector('[data-opt-remove]').addEventListener('click', function () { optState.splice(idx, 1); renderOptRows(); });
      row.querySelector('[data-opt-name]').addEventListener('input', function () { optState[idx].name = this.value; renderCombos(); });
      row.querySelector('[data-opt-values]').addEventListener('input', function () { optState[idx].values = this.value.split(',').map(function (v) { return v.trim(); }); renderCombos(); });
      optRows.appendChild(row);
    });
    addBtn.classList.toggle('hidden', optState.length >= 3);
    renderCombos();
  }

  addBtn.addEventListener('click', function () { optState.push({ name: '', values: [] }); renderOptRows(); });
  renderOptRows();

  document.querySelector('form').addEventListener('submit', function () {
    document.getElementById('options_json').value = JSON.stringify(readRows());
    document.getElementById('variants_json').value = JSON.stringify(currentVariantInputs());
  });
})();
</script>
<?php admin_footer(); ?>
