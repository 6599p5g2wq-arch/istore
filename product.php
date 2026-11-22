<?php
require __DIR__ . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';
require APP_ROOT . '/includes/product-card.php';

$slug = trim($_GET['slug'] ?? '');
$p = get_product($slug);
if (!$p) { http_response_code(404); $page_title = 'منتج غير موجود'; require APP_ROOT . '/includes/store-header.php';
    echo '<div class="mx-auto max-w-7xl px-4 py-32 text-center"><h1 class="text-3xl font-black">المنتج غير موجود</h1><a href="' . e(url('products.php')) . '" class="glow-btn mt-6 inline-block rounded-full px-8 py-3 font-bold">تصفح المنتجات</a></div>';
    require APP_ROOT . '/includes/store-footer.php'; exit; }

$gallery = product_images($p);
$options = parse_options($p['options'] ?? '');
$variants = $options ? array_map(fn($v) => [
    'id' => (int)$v['id'], 'label' => $v['label'], 'options' => json_decode($v['options'] ?: '{}', true) ?: [],
    'price' => $v['price'] !== null ? (float)$v['price'] : null, 'stock' => (int)$v['stock'], 'image' => $v['image'] ? img_url($v['image']) : '',
], get_variants((int)$p['id'])) : [];
$related = qall(
    'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.active = 1 AND p.category_id = ? AND p.id != ? ORDER BY RAND() LIMIT 4', [$p['category_id'], $p['id']]);
$old = $p['old_price'] !== null && $p['old_price'] !== '' && (float)$p['old_price'] > (float)$p['price'] ? (float)$p['old_price'] : null;
$discount = $old ? round((1 - $p['price'] / $old) * 100) : 0;
$reviews = qall('SELECT * FROM reviews WHERE product_id = ? AND approved = 1 ORDER BY id DESC LIMIT 20', [$p['id']]);
$avg = $reviews ? array_sum(array_column($reviews, 'rating')) / count($reviews) : (float)$p['rating'];
$wa = setting('whatsapp');
$waMsg = $wa ? ('https://wa.me/' . preg_replace('/\D/', '', $wa) . '?text=' . rawurlencode('السلام عليكم، أريد طلب: ' . $p['name'] . ' — ' . format_price($p['price']))) : '';
$jsData = e(json_encode(['id' => (int)$p['id'], 'name' => $p['name'], 'price' => (float)$p['price'], 'image' => img_url($p['image']), 'slug' => $p['slug'], 'stock' => (int)$p['stock']], JSON_UNESCAPED_UNICODE));
$page_title = $p['name'];
$page_desc = mb_substr($p['description'], 0, 150);
require APP_ROOT . '/includes/store-header.php';
?>
<div class="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
  <nav class="mb-8 flex items-center gap-1.5 text-sm text-[var(--text-faint)]">
    <a href="<?= e(url('index.php')) ?>" class="hover:text-[var(--text)]">الرئيسية</a>
    <?= icon('chevron-left', 14) ?>
    <a href="<?= e(url('products.php')) ?>" class="hover:text-[var(--text)]">المنتجات</a>
    <?php if ($p['category_name']): ?>
    <?= icon('chevron-left', 14) ?>
    <a href="<?= e(url('products.php?category=' . $p['category_slug'])) ?>" class="hover:text-[var(--text)]"><?= e($p['category_name']) ?></a>
    <?php endif; ?>
  </nav>

  <div class="grid gap-10 lg:grid-cols-2">
    <div class="reveal in">
      <div class="relative">
        <div class="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-2)]">
          <img id="main-img" src="<?= e(img_url($gallery[0] ?? '')) ?>" alt="<?= e($p['name']) ?>" class="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105">
          <?php if ($p['badge']): ?><span class="absolute right-4 top-4 rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow <?= $p['badge'] === 'خصم' ? 'bg-red-500' : ($p['badge'] === 'جديد' ? 'bg-emerald-500' : 'bg-[var(--accent)]') ?>"><?= e($p['badge']) ?></span><?php endif; ?>
          <?php if ($discount): ?><span class="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black">خصم <?= $discount ?>%</span><?php endif; ?>
        </div>
        <button onclick='Wish.toggle(<?= htmlspecialchars(json_encode(['id' => (int)$p['id']]), ENT_QUOTES) ?>)' data-wish-btn="<?= (int)$p['id'] ?>" aria-label="المفضلة" class="absolute bottom-4 left-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"><?= icon('heart', 18) ?></button>
      </div>
      <?php if (count($gallery) > 1): ?>
      <div class="mt-3 grid grid-cols-4 gap-3">
        <?php foreach (array_slice($gallery, 1, 4) as $g): ?>
        <button onclick="document.getElementById('main-img').src='<?= e(img_url($g)) ?>'" class="overflow-hidden rounded-2xl bg-[var(--surface-2)] ring-1 ring-white/10 transition hover:ring-[var(--accent)]">
          <img src="<?= e(img_url($g)) ?>" alt="" class="aspect-square w-full object-cover">
        </button>
        <?php endforeach; ?>
      </div>
      <?php endif; ?>
    </div>

    <div class="reveal in">
      <div class="flex items-center gap-3 text-sm">
        <?php if ($p['category_name']): ?><a href="<?= e(url('products.php?category=' . $p['category_slug'])) ?>" class="rounded-full bg-[var(--chip)] px-3 py-1 font-bold text-[var(--text-dim)] hover:bg-[var(--chip-hover)]"><?= e($p['category_name']) ?></a><?php endif; ?>
        <?php if ($p['brand_name']): ?><a href="<?= e(url('products.php?brand=' . $p['brand_slug'])) ?>" class="rounded-full bg-[var(--chip)] px-3 py-1 font-bold text-[var(--text-dim)] hover:bg-[var(--chip-hover)]"><?= e($p['brand_name']) ?></a><?php endif; ?>
        <span class="flex items-center gap-1 text-amber-400"><?= icon('star', 15, 'fill-current') ?><b><?= number_format($avg, 1) ?></b><?php if ($reviews): ?><span class="text-[var(--text-faint)]">(<?= count($reviews) ?>)</span><?php endif; ?></span>
      </div>
      <h1 class="mt-4 text-3xl font-black leading-snug text-white sm:text-4xl"><?= e($p['name']) ?></h1>
      <div class="mt-5 flex items-baseline gap-3">
        <span id="price-main" class="text-4xl font-black text-[var(--accent)]"><?= e(format_price($p['price'])) ?></span>
        <?php if ($old): ?><span class="text-xl text-[var(--text-faint)] line-through"><?= e(format_price($old)) ?></span><?php endif; ?>
      </div>
      <p class="mt-6 whitespace-pre-line leading-8 text-[var(--text-dim)]"><?= e($p['description']) ?></p>

      <div class="mt-6" id="stock-badge-box">
        <?php if ((int)$p['stock'] <= 0): ?>
        <span class="inline-block rounded-full bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400">نفدت الكمية — قريباً</span>
        <?php elseif ((int)$p['stock'] <= 5): ?>
        <span class="inline-block rounded-full bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400">باقي <?= (int)$p['stock'] ?> فقط — اطلب الآن</span>
        <?php else: ?>
        <span class="inline-block rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400">متوفر في المخزون</span>
        <?php endif; ?>
      </div>

      <?php if ($options): ?>
      <div class="mt-6 space-y-4" id="variant-picker">
        <?php foreach ($options as $oi => $opt): ?>
        <div>
          <p class="mb-2 text-sm font-bold text-[var(--text-dim)]"><?= e($opt['name']) ?></p>
          <div class="flex flex-wrap gap-2" data-opt-group="<?= $oi ?>">
            <?php foreach ($opt['values'] as $v): ?>
            <button type="button" data-opt-value="<?= e($v) ?>" class="rounded-full border border-[var(--border-strong)] bg-[var(--card)] px-4 py-2 text-sm font-bold transition hover:border-[var(--accent)]"><?= e($v) ?></button>
            <?php endforeach; ?>
          </div>
        </div>
        <?php endforeach; ?>
        <p id="variant-hint" class="text-xs font-bold text-amber-400">اختر <?= e(implode(' و', array_column($options, 'name'))) ?> أولاً</p>
      </div>
      <?php endif; ?>

      <?php if ((int)$p['stock'] > 0): ?>
      <div class="mt-6 flex items-center gap-3">
        <div class="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2.5">
          <button id="qty-inc" onclick="var q=document.getElementById('qty');q.value=Math.min(window._maxQty||<?= (int)$p['stock'] ?>,+q.value+1)" class="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--chip)]"><?= icon('plus', 16) ?></button>
          <input id="qty" type="text" value="1" readonly class="w-10 bg-transparent text-center text-lg font-extrabold outline-none">
          <button id="qty-dec" onclick="var q=document.getElementById('qty');q.value=Math.max(1,+q.value-1)" class="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--chip)]"><?= icon('minus', 16) ?></button>
        </div>
        <button id="add-btn" onclick='Cart.add(<?= $jsData ?>, +document.getElementById("qty").value)' class="glow-btn flex-1 rounded-full py-3.5 text-center font-bold transition hover:scale-[1.02] active:scale-95">أضف إلى السلة</button>
      </div>
      <?php endif; ?>

      <?php if ($waMsg): ?>
      <a href="<?= e($waMsg) ?>" target="_blank" rel="noreferrer" class="mt-3 flex items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 py-3.5 font-bold text-emerald-400 transition hover:bg-emerald-500/20">
        <?= icon('whatsapp', 18) ?> اطلب عبر واتساب
      </a>
      <?php endif; ?>

      <?php if ((int)$p['stock'] <= 0): ?>
      <form onsubmit="return submitStockAlert(event, <?= (int)$p['id'] ?>)" class="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <p class="mb-2 text-sm font-bold">نبّهني عند التوفر</p>
        <div class="flex gap-2">
          <input name="contact" required placeholder="رقم هاتفك أو بريدك" class="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none">
          <button class="glow-btn shrink-0 rounded-xl px-4 text-sm font-bold">تنبيه</button>
        </div>
        <p class="stock-alert-msg mt-2 hidden text-sm font-bold text-emerald-400">تم التسجيل، سنخبرك فور توفره</p>
      </form>
      <script>
      function submitStockAlert(ev, pid) {
        ev.preventDefault();
        var f = ev.target, c = f.contact.value.trim();
        if (!c) return false;
        fetch(window.BASE + '/api/stock-alert.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: pid, contact: c }) })
          .then(function () { f.querySelector('.stock-alert-msg').classList.remove('hidden'); f.contact.value = ''; });
        return false;
      }
      </script>
      <?php endif; ?>

      <div class="mt-8 grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-8 text-center">
        <div class="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <span class="mx-auto block w-fit text-[var(--accent)]"><?= icon('truck', 22) ?></span>
          <p class="mt-2 text-sm font-bold text-[var(--text)]">توصيل سريع</p><p class="text-xs text-[var(--text-faint)]">24-72 ساعة</p>
        </div>
        <div class="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <span class="mx-auto block w-fit text-[var(--accent)]"><?= icon('shield', 22) ?></span>
          <p class="mt-2 text-sm font-bold text-[var(--text)]">منتج أصلي</p><p class="text-xs text-[var(--text-faint)]">مع ضمان</p>
        </div>
        <div class="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <span class="mx-auto block w-fit text-[var(--accent)]"><?= icon('settings', 22) ?></span>
          <p class="mt-2 text-sm font-bold text-[var(--text)]">استبدال سهل</p><p class="text-xs text-[var(--text-faint)]">خلال 7 أيام</p>
        </div>
      </div>
    </div>
  </div>

  <!-- التقييمات -->
  <section class="mt-20">
    <h2 class="reveal mb-8 text-2xl font-black text-white sm:text-3xl">تقييمات الزبائن <?php if ($reviews): ?><span class="text-base font-bold text-[var(--text-faint)]">(<?= count($reviews) ?>)</span><?php endif; ?></h2>
    <div class="grid gap-8 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <?php if (!$reviews): ?><p class="rounded-2xl bg-[var(--card)] p-8 text-center text-sm text-[var(--text-dim)]">لا تقييمات بعد — كن أول من يقيّم بعد استلام طلبك.</p><?php endif; ?>
        <?php foreach ($reviews as $r): ?>
        <div class="rounded-2xl border border-[var(--border)] bg-white/[0.04] p-5">
          <div class="flex items-center gap-2">
            <div class="flex"><?php for ($n = 1; $n <= 5; $n++): ?><span class="<?= $n <= (int)$r['rating'] ? 'text-amber-400' : 'text-neutral-700' ?>"><?= icon('star', 15, 'fill-current') ?></span><?php endfor; ?></div>
            <span class="text-sm font-bold text-white"><?= e($r['customer_name']) ?></span>
            <span class="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400"><?= icon('badge-check', 12) ?> مشترٍ موثق</span>
          </div>
          <?php if ($r['comment']): ?><p class="mt-3 text-sm leading-7 text-[var(--text-dim)]"><?= e($r['comment']) ?></p><?php endif; ?>
        </div>
        <?php endforeach; ?>
      </div>
      <div>
        <form onsubmit="return submitReview(event)" class="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 class="mb-1 font-black">قيّم هذا المنتج</h3>
          <p class="mb-4 text-xs text-[var(--text-faint)]">التقييم متاح فقط بعد استلام طلبك — نتحقق من رقم الطلب وهاتفك</p>
          <input type="hidden" name="product_id" value="<?= (int)$p['id'] ?>">
          <input name="name" required placeholder="اسمك" class="mb-2 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none">
          <div class="mb-2 flex items-center gap-1" id="rating-stars">
            <?php for ($n = 1; $n <= 5; $n++): ?>
            <button type="button" onclick="setRating(<?= $n ?>)" data-star="<?= $n ?>" class="text-amber-400"><?= icon('star', 22, 'fill-current') ?></button>
            <?php endfor; ?>
            <input type="hidden" name="rating" id="rating-input" value="5">
          </div>
          <textarea name="comment" rows="3" placeholder="رأيك في المنتج (اختياري)" class="mb-2 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none"></textarea>
          <input name="phone" required placeholder="رقم هاتفك المستخدم في الطلب" class="mb-2 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none">
          <input name="order_code" required placeholder="رقم الطلب (مثل IST-ABC123)" class="mb-3 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none" dir="ltr">
          <button class="glow-btn w-full rounded-xl py-3 font-bold">إرسال التقييم</button>
          <p class="review-msg mt-2 hidden text-sm font-bold"></p>
        </form>
        <script>
        function setRating(n) {
          document.getElementById('rating-input').value = n;
          document.querySelectorAll('#rating-stars [data-star]').forEach(function (b) {
            b.classList.toggle('opacity-30', +b.dataset.star > n);
          });
        }
        function submitReview(ev) {
          ev.preventDefault();
          var f = ev.target, msg = f.querySelector('.review-msg');
          var body = { product_id: +f.product_id.value, name: f.name.value, rating: +f.rating.value, comment: f.comment.value, phone: f.phone.value, order_code: f.order_code.value };
          fetch(window.BASE + '/api/review.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
            .then(function (res) {
              msg.classList.remove('hidden');
              msg.classList.toggle('text-emerald-400', res.ok);
              msg.classList.toggle('text-red-400', !res.ok);
              msg.textContent = res.ok ? 'شكراً لك! نُشر تقييمك.' : (res.d.error || 'تعذر إرسال التقييم');
              if (res.ok) f.reset();
            });
          return false;
        }
        </script>
      </div>
    </div>
  </section>

  <?php if ($related): ?>
  <section class="mt-24">
    <h2 class="reveal mb-8 text-2xl font-black text-white sm:text-3xl">منتجات مشابهة</h2>
    <div class="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      <?php foreach ($related as $i => $rp) echo product_card($rp, $i); ?>
    </div>
  </section>
  <?php endif; ?>
</div>

<?php if ($options): ?>
<script>
(function () {
  var OPTIONS = <?= json_encode($options, JSON_UNESCAPED_UNICODE) ?>;
  var VARIANTS = <?= json_encode($variants, JSON_UNESCAPED_UNICODE) ?>;
  var BASE_DATA = { id: <?= (int)$p['id'] ?>, name: <?= json_encode($p['name'], JSON_UNESCAPED_UNICODE) ?>, price: <?= (float)$p['price'] ?>, image: <?= json_encode(img_url($p['image'])) ?>, slug: <?= json_encode($p['slug']) ?>, stock: <?= (int)$p['stock'] ?> };
  var selected = {};
  var currentVariant = null;
  var addBtn = document.getElementById('add-btn');
  var hint = document.getElementById('variant-hint');
  var priceMain = document.getElementById('price-main');
  var badgeBox = document.getElementById('stock-badge-box');
  var qtyInput = document.getElementById('qty');

  function findVariant() {
    if (Object.keys(selected).length < OPTIONS.length) return undefined;
    return VARIANTS.find(function (v) {
      return OPTIONS.every(function (o) { return v.options[o.name] === selected[o.name]; });
    }) || null;
  }

  function comboAvailable(optionName, value) {
    var probe = Object.assign({}, selected);
    probe[optionName] = value;
    return VARIANTS.some(function (v) {
      var match = OPTIONS.every(function (o) { return probe[o.name] === undefined || v.options[o.name] === probe[o.name]; });
      return match && v.stock > 0;
    });
  }

  function paintChips() {
    document.querySelectorAll('[data-opt-group]').forEach(function (group) {
      var oi = +group.getAttribute('data-opt-group');
      var opt = OPTIONS[oi];
      group.querySelectorAll('[data-opt-value]').forEach(function (chip) {
        var val = chip.getAttribute('data-opt-value');
        var active = selected[opt.name] === val;
        var avail = comboAvailable(opt.name, val);
        chip.classList.toggle('!border-[var(--accent)]', active);
        chip.classList.toggle('bg-[var(--accent)]', active);
        chip.classList.toggle('!text-white', active);
        chip.classList.toggle('opacity-40', !avail && !active);
        chip.classList.toggle('line-through', !avail && !active);
      });
    });
  }

  function update() {
    paintChips();
    var v = findVariant();
    if (v === undefined) {
      currentVariant = null;
      if (hint) { hint.classList.remove('hidden'); }
      if (addBtn) { addBtn.disabled = true; addBtn.classList.add('opacity-50', 'pointer-events-none'); }
      priceMain.textContent = window.fmtPrice(BASE_DATA.price);
      return;
    }
    currentVariant = v;
    if (hint) hint.classList.add('hidden');
    priceMain.textContent = window.fmtPrice(v.price !== null ? v.price : BASE_DATA.price);
    if (badgeBox) {
      if (v.stock <= 0) badgeBox.innerHTML = '<span class="inline-block rounded-full bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400">هذه التوليفة نفدت</span>';
      else if (v.stock <= 5) badgeBox.innerHTML = '<span class="inline-block rounded-full bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400">باقي ' + v.stock + ' فقط — اطلب الآن</span>';
      else badgeBox.innerHTML = '<span class="inline-block rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400">متوفر في المخزون</span>';
    }
    if (addBtn) {
      var ok = v.stock > 0;
      addBtn.disabled = !ok;
      addBtn.classList.toggle('opacity-50', !ok);
      addBtn.classList.toggle('pointer-events-none', !ok);
    }
    if (qtyInput) qtyInput.value = '1';
    if (v.image) { var mi = document.getElementById('main-img'); if (mi) mi.src = v.image; }
  }

  document.querySelectorAll('[data-opt-group]').forEach(function (group) {
    var oi = +group.getAttribute('data-opt-group');
    var opt = OPTIONS[oi];
    group.querySelectorAll('[data-opt-value]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var val = chip.getAttribute('data-opt-value');
        if (selected[opt.name] === val) delete selected[opt.name];
        else selected[opt.name] = val;
        update();
      });
    });
  });

  if (addBtn) {
    addBtn.disabled = true;
    addBtn.classList.add('opacity-50', 'pointer-events-none');
    addBtn.removeAttribute('onclick');
    addBtn.addEventListener('click', function () {
      var v = currentVariant;
      if (!v || v.stock <= 0) return;
      var qty = qtyInput ? +qtyInput.value : 1;
      Cart.add({ id: BASE_DATA.id, name: BASE_DATA.name, price: v.price !== null ? v.price : BASE_DATA.price, image: v.image || BASE_DATA.image, slug: BASE_DATA.slug, stock: v.stock, variant_id: v.id, variant_label: v.label }, qty);
    });
  }
  // حد أقصى للكمية حسب مخزون التوليفة
  window._maxQty = BASE_DATA.stock;
  var _origUpdate = update;
  update = function () { _origUpdate(); window._maxQty = currentVariant ? currentVariant.stock : BASE_DATA.stock; };
})();
</script>
<?php endif; ?>
<?php require APP_ROOT . '/includes/store-footer.php'; ?>
