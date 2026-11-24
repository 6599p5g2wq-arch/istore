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
    $rating = max(0,min(5,(float)($_POST['rating']??4.8)));
    $badge = mb_substr(trim($_POST['badge'] ?? ''), 0, 100);
    $description = trim($_POST['description'] ?? '');
    $featured = !empty($_POST['featured']) ? 1 : 0;
    $active = !empty($_POST['active']) ? 1 : 0;
    $image = trim($_POST['image'] ?? '');
    $uploaded = handle_image_upload('image_file');
    if ($uploaded) $image = $uploaded;
    $images = array_values(array_filter(array_map('trim', explode("\n", $_POST['images'] ?? ''))));
    // رفع عدة صور للمعرض دفعة واحدة
    if (!empty($_FILES['gallery_files']) && is_array($_FILES['gallery_files']['name'])) {
        foreach ($_FILES['gallery_files']['name'] as $gi => $gname) {
            if (($_FILES['gallery_files']['error'][$gi] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) continue;
            if (($_FILES['gallery_files']['size'][$gi] ?? 0) > 4 * 1024 * 1024) continue;
            if(!valid_image_upload(['name'=>$gname,'tmp_name'=>$_FILES['gallery_files']['tmp_name'][$gi],'size'=>$_FILES['gallery_files']['size'][$gi],'error'=>$_FILES['gallery_files']['error'][$gi]]))continue;
            $gext = strtolower(pathinfo($gname, PATHINFO_EXTENSION));
            if (!in_array($gext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'], true)) continue;
            $gfile = 'up-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . $gext;
            $gdir = APP_ROOT . '/uploads';
            if (!is_dir($gdir)) mkdir($gdir, 0775, true);
            if (move_uploaded_file($_FILES['gallery_files']['tmp_name'][$gi], $gdir . '/' . $gfile)) $images[] = 'uploads/' . $gfile;
        }
        $images = array_slice(array_values(array_unique($images)), 0, 8);
    }
    $options = json_encode(parse_options($_POST['options_json'] ?? ''), JSON_UNESCAPED_UNICODE);
    $variantInputs = json_decode($_POST['variants_json'] ?? '[]', true);
    if (!is_array($variantInputs)) $variantInputs = [];
    $hasVariants = count(json_decode($options, true) ?: []) > 0;
    if (!$name || $price <= 0) {
        flash('الاسم والسعر مطلوبان', true);
    } elseif ($oldPrice !== null && $oldPrice <= $price) {
        flash('السعر قبل الخصم يجب أن يكون أكبر من السعر الحالي', true);
    } else {
        // تأكد من فرادة الرابط
        $dup = qone('SELECT id FROM products WHERE slug = ? AND id != ?', [$slug, $id]);
        if ($dup) $slug .= '-' . substr(bin2hex(random_bytes(2)), 0, 4);
        if ($p) {
            q('UPDATE products SET name=?, slug=?, category_id=?, brand_id=?, description=?, price=?, old_price=?, stock=?, image=?, images=?, options=?, badge=?, featured=?, active=?, rating=? WHERE id=?',
              [$name, $slug, $categoryId, $brandId, $description, $price, $oldPrice, $stock, $image, json_encode($images, JSON_UNESCAPED_UNICODE), $options, $badge, $featured, $active, $rating, $id]);
            replace_variants($id, $options, $variantInputs);
            $newStock = (int)(qone('SELECT stock FROM products WHERE id = ?', [$id])['stock'] ?? 0);
            if ((int)$p['stock'] <= 0 && $newStock > 0) notify_stock_restocked($id, $name, $slug);
            flash('تم حفظ التعديلات');
        } else {
            q('INSERT INTO products (name, slug, category_id, brand_id, description, price, old_price, stock, image, images, options, badge, featured, active, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [$name, $slug, $categoryId, $brandId, $description, $price, $oldPrice, $stock, $image, json_encode($images, JSON_UNESCAPED_UNICODE), $options, $badge, $featured, $active, $rating]);
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
<h1 class="text-2xl font-black sm:text-3xl"><?= $p ? 'تعديل: ' . e($p['name']) : 'منتج جديد' ?></h1>
<?php admin_msg(); ?>
<form id="product-form" method="post" enctype="multipart/form-data" class="mt-8 grid min-w-0 gap-6 lg:grid-cols-3">
<div class="min-w-0 space-y-5 lg:col-span-2"><div class="admin-card min-w-0 space-y-5 p-6">
<label class="block text-sm font-bold">اسم المنتج *<input name="name" required value="<?=e($p['name']??'')?>" class="admin-input mt-1.5" placeholder="غطاء سيليكون أصلي MagSafe"></label>
<label class="block text-sm font-bold">الرابط (slug) *<input name="slug" dir="ltr" value="<?=e($p['slug']??'')?>" class="admin-input mt-1.5 text-left" placeholder="iphone-16-silicone-case"></label>
<label class="block text-sm font-bold">الوصف<textarea name="description" rows="5" class="admin-input mt-1.5 resize-y" placeholder="وصف تفصيلي يظهر في صفحة المنتج…"><?=e($p['description']??'')?></textarea></label>
<div data-image-picker><span class="text-sm font-bold">الصورة الرئيسية</span><div class="mt-1.5 flex items-center gap-3"><div class="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200" hidden><img alt="" class="h-full w-full object-cover"><button type="button" data-remove aria-label="إزالة" class="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"><?=icon('x',12)?></button></div><label class="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-neutral-50"><?=icon('upload',16)?> رفع صورة<input type="file" accept="image/*" class="hidden"></label></div><input name="image" dir="ltr" value="<?=e($p['image']??'')?>" placeholder="/images/example.jpg أو رابط خارجي" class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-left text-xs text-neutral-500"><p role="status" class="mt-2 text-xs text-red-600"></p></div>
<div data-gallery-picker><span class="text-sm font-bold">معرض الصور</span><div data-gallery-items class="mt-1.5 flex flex-wrap items-center gap-3"></div><label class="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full border bg-white px-4 py-2.5 text-sm font-bold shadow-sm"><?=icon('upload',16)?> إضافة صور<input data-gallery-files type="file" accept="image/*" multiple class="hidden"></label><textarea name="images" hidden><?=e($imagesText)?></textarea><p data-gallery-status role="status" class="mt-2 text-xs text-red-600"></p><p class="mt-1.5 text-[11px] text-neutral-400">حتى 8 صور إضافية تظهر كمعرض في صفحة المنتج.</p></div>
<div class="rounded-2xl border border-neutral-200 p-4" id="variants-card"><div class="flex items-center justify-between gap-3"><div><h2 class="text-sm font-bold">خيارات المنتج (متغيرات)</h2><p class="mt-1 text-xs text-neutral-500">مثال: الخيار «الجهاز» بقيم «16 Pro Max، 16 Pro، 16» أو «اللون» بقيم «أسود، أبيض». يمكن الجمع بين خيارين أو ثلاثة، ولكل توليفة مخزونها وسعرها وصورتها الاختيارية.</p></div><button type="button" id="opt-add" class="flex shrink-0 items-center gap-1 rounded-full bg-black px-4 py-2 text-xs font-bold text-white"><?=icon('plus',14)?> أضف خياراً</button></div><div id="opt-rows" class="mt-3 space-y-3"></div><div id="variant-combos" class="mt-4 space-y-2 overflow-x-auto"></div><input type="hidden" name="options_json" id="options_json"><input type="hidden" name="variants_json" id="variants_json"></div></div></div>
<div class="min-w-0 space-y-5"><div class="admin-card space-y-4 p-6">
<label class="block text-sm font-bold">التصنيف<select name="category_id" class="admin-input mt-1.5"><option value="">بدون تصنيف</option><?php foreach($cats as $c):?><option value="<?=(int)$c['id']?>" <?=($p['category_id']??($cats[0]['id']??null))==$c['id']?'selected':''?>><?=e($c['name'])?></option><?php endforeach;?></select></label>
<label class="block text-sm font-bold">الماركة<select name="brand_id" class="admin-input mt-1.5"><option value="">بدون ماركة</option><?php foreach($brands as $b):?><option value="<?=(int)$b['id']?>" <?=($p['brand_id']??null)==$b['id']?'selected':''?>><?=e($b['name'])?></option><?php endforeach;?></select></label>
<div class="grid grid-cols-2 gap-3"><label class="block text-sm font-bold">السعر *<input name="price" type="number" step="0.01" min="0" required value="<?=e((string)($p['price']??''))?>" class="admin-input mt-1.5"></label><label class="block text-sm font-bold">السعر قبل الخصم<input name="old_price" type="number" step="0.01" min="0" value="<?=e((string)($p['old_price']??''))?>" placeholder="اختياري" class="admin-input mt-1.5"></label></div>
<div class="grid grid-cols-2 gap-3"><label class="block text-sm font-bold">المخزون<input id="f-stock" name="stock" type="number" min="0" value="<?=e((string)($p['stock']??10))?>" class="admin-input mt-1.5 disabled:bg-neutral-100 disabled:text-neutral-400"><span id="stock-note" class="mt-1 hidden text-[11px] font-normal text-neutral-400">يُحسب من المتغيرات</span></label><label class="block text-sm font-bold">التقييم (0-5)<input name="rating" type="number" min="0" max="5" step="0.1" value="<?=e((string)($p['rating']??4.8))?>" class="admin-input mt-1.5"></label></div>
<label class="block text-sm font-bold">شارة مميزة<select name="badge" class="admin-input mt-1.5"><?php foreach([''=>'بدون شارة','جديد'=>'جديد','الأكثر مبيعاً'=>'الأكثر مبيعاً','خصم'=>'خصم','حصري'=>'حصري']+(!empty($p['badge'])?[$p['badge']=>$p['badge']]:[]) as $v=>$l):?><option value="<?=e($v)?>" <?=($p['badge']??'')===$v?'selected':''?>><?=e($l)?></option><?php endforeach;?></select></label></div>
<div class="admin-card space-y-3 p-6"><label class="flex cursor-pointer items-center justify-between text-sm font-bold">منتج مميز (يظهر بالرئيسية)<input type="checkbox" name="featured" <?=($p['featured']??0)?'checked':''?> class="h-5 w-5 accent-black"></label><label class="flex cursor-pointer items-center justify-between text-sm font-bold">ظاهر في المتجر<input type="checkbox" name="active" <?=($p['active']??1)?'checked':''?> class="h-5 w-5 accent-black"></label></div>
<button class="flex w-full items-center justify-center gap-2 rounded-full bg-black py-4 font-bold text-white shadow-lg transition hover:bg-neutral-800"><?=icon('save',18)?> <?=$p?'حفظ التعديلات':'إضافة المنتج'?></button><a href="<?=e(admin_url('products.php'))?>" class="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white py-3.5 font-bold text-neutral-700"><?=icon('arrow-right',18)?> رجوع بدون حفظ</a></div></form>
<style>#product-form .admin-input{padding:12px 16px;border-radius:16px;border-color:#e5e5e5;background:#fff}#product-form{color:#18182e}#variant-combos table input{padding:6px 8px}#opt-rows [data-opt-name]{width:160px}#opt-rows [data-opt-values]{flex:1;min-width:0}</style><script src="<?=e(url('assets/image-picker.js'))?>" defer></script><script src="<?=e(url('assets/gallery-picker.js'))?>" defer></script>
<script>
var INIT_OPTIONS = <?= json_encode($existingOptions, JSON_UNESCAPED_UNICODE|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT) ?>;
var INIT_VARIANTS = <?= json_encode($existingVariants, JSON_UNESCAPED_UNICODE|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT) ?>;
(function () {
  var esc=function(v){var n=document.createElement('span');n.textContent=String(v);return n.innerHTML.replace(/"/g,'&quot;')};
  var optRows = document.getElementById('opt-rows');
  var combosBox = document.getElementById('variant-combos');
  var addBtn = document.getElementById('opt-add');
  var optState = INIT_OPTIONS.map(function (o) { return { name: o.name, values: o.values }; });

  function readRows() {
    var out = [];
    optRows.querySelectorAll('[data-opt]').forEach(function (row) {
      var name = row.querySelector('[data-opt-name]').value.trim();
      var values = row.querySelector('[data-opt-values]').value.split(/[,،\n]/).map(function (v) { return v.trim(); }).filter(Boolean);
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
    var table=document.createElement('table');table.className='w-full min-w-[520px] text-sm';table.innerHTML='<thead><tr class="border-b border-neutral-200 text-right text-xs text-neutral-500"><th class="py-2">التوليفة</th><th class="py-2">المخزون</th><th class="py-2">سعر خاص (اختياري)</th><th class="py-2">صورة (اختياري)</th></tr></thead>';var tbody=document.createElement('tbody');table.appendChild(tbody);combosBox.appendChild(table);
    combos(options).forEach(function(c){var l=label(c,options),v=prev[l]||initMap[l]||{stock:0,price:null,image:''};var row=document.createElement('tr');row.className='border-b border-neutral-100 last:border-0';row.setAttribute('data-combo',JSON.stringify(c));var text=document.createElement('td');text.className='py-2 pl-2 font-bold';text.textContent=l;row.appendChild(text);[['stock',v.stock||0,'number','w-20'],['price',v.price==null?'':v.price,'number','w-24'],['image',v.image||'','text','w-40']].forEach(function(field){var td=document.createElement('td'),input=document.createElement('input');td.className='py-2 pl-2';input.setAttribute('data-v-'+field[0],'');input.type=field[2];input.value=field[1];input.className=field[3]+' rounded-lg border border-neutral-200 px-2 py-1.5 outline-none focus:border-black';if(field[2]==='number'){input.min='0';input.step=field[0]==='price'?'0.01':'1'}else input.dir='ltr';td.appendChild(input);if(field[0]==='image'){var preview=document.createElement('img');preview.alt='';preview.className='mb-2 h-20 w-20 rounded-2xl object-cover';var syncPreview=function(){var src=input.value.trim();preview.hidden=!/^(https?:\/\/|\/|images\/|uploads\/)/i.test(src);if(!preview.hidden)preview.src=src};input.addEventListener('input',syncPreview);syncPreview();td.prepend(preview);var labelUpload=document.createElement('label');labelUpload.className='my-2 inline-flex cursor-pointer items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs font-bold';labelUpload.textContent='رفع صورة';var file=document.createElement('input');file.type='file';file.accept='image/*';file.hidden=true;labelUpload.appendChild(file);td.insertBefore(labelUpload,input);file.onchange=async function(){if(!file.files[0])return;var fd=new FormData();fd.append('file',file.files[0]);fd.append('form_csrf',document.querySelector('[name=form_csrf]').value);file.disabled=true;try{var r=await fetch('upload-image.php',{method:'POST',body:fd}),d=await r.json();if(!r.ok||!d.path)throw Error(d.error||'فشل الرفع');input.value=d.path;syncPreview();input.dispatchEvent(new Event('input',{bubbles:true}))}catch(e){alert(e.message||'تعذر الاتصال')}finally{file.disabled=false;file.value=''}};}row.appendChild(td)});tbody.appendChild(row)});
    var hint=document.createElement('p');hint.className='mt-2 text-xs text-neutral-500';hint.textContent='اترك سعر خاص فارغاً لاستخدام سعر المنتج الأساسي. مخزون المنتج الكلي يُحسب تلقائياً من مجموع مخزون التوليفات.';combosBox.appendChild(hint);

  }

  function renderOptRows() {
    optRows.innerHTML = '';
    optState.forEach(function (o, idx) {
      var row = document.createElement('div');
      row.className = 'flex flex-wrap items-start gap-2 rounded-xl bg-neutral-50 p-3';
      row.setAttribute('data-opt', '1');
      row.innerHTML = '<input data-opt-name placeholder="اسم الخيار (مثال: اللون)" value="' + esc(o.name) + '" class="admin-input">'
        + '<input data-opt-values placeholder="القيم مفصولة بفواصل: أسود, أبيض, أزرق" value="' + esc(o.values.join('، ')) + '" class="admin-input">'
        + '<button type="button" class="grid h-9 w-9 place-items-center rounded-full text-neutral-400 hover:bg-red-50 hover:text-red-500" aria-label="حذف الخيار" data-opt-remove>×</button>';
      row.querySelector('[data-opt-remove]').addEventListener('click', function () { optState.splice(idx, 1); renderOptRows(); });
      row.querySelector('[data-opt-name]').addEventListener('input', function () { optState[idx].name = this.value; renderCombos(); });
      row.querySelector('[data-opt-values]').addEventListener('input', function () { optState[idx].values = this.value.split(/[,،\n]/).map(function (v) { return v.trim(); }); renderCombos(); });
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
    window.__formSaved = true;
  });

  // توليد الـ slug تلقائياً من الاسم عند الإضافة ما لم يُعدّل يدوياً
  (function () {
    var nameInput = document.querySelector('input[name=name]');
    var slugInput = document.querySelector('input[name=slug]');
    if (!nameInput || !slugInput) return;
    var touched = slugInput.value !== '';
    slugInput.addEventListener('input', function () { touched = true; });
    nameInput.addEventListener('input', function () {
      if (touched) return;
      slugInput.value = nameInput.value.trim().toLowerCase()
        .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-');
    });
  })();

  // تحذير عند مغادرة الصفحة بتعديلات غير محفوظة
  (function () {
    var dirty = false;
    document.querySelector('form').addEventListener('input', function () { dirty = true; });
    window.addEventListener('beforeunload', function (e) {
      if (dirty && !window.__formSaved) { e.preventDefault(); e.returnValue = ''; }
    });
  })();
})();
</script>
<?php admin_footer(); ?>
