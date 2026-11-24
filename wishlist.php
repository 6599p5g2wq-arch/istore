<?php
require __DIR__ . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';
// المفضلة: منتجات مخزنة كمعرفات في متصفح الزبون، نمرر بياناتها للواجهة
$all = qall('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.active = 1');
$catalog = [];
foreach ($all as $p) {
    $catalog[$p['id']] = [
        'id' => (int)$p['id'], 'name' => $p['name'], 'slug' => $p['slug'], 'price' => (float)$p['price'],
        'old_price' => $p['old_price'] !== null ? (float)$p['old_price'] : null, 'image' => img_url($p['image']),
        'stock' => (int)$p['stock'], 'rating' => (float)$p['rating'], 'badge' => $p['badge'],
        'category_name' => $p['category_name'],
    ];
}
$page_title = 'المفضلة';
require APP_ROOT . '/includes/store-header.php';
?>
<div class="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
  <h1 class="text-3xl font-black sm:text-4xl">المفضلة</h1>
  <div id="wish-root" class="mt-8"></div>
</div>
<script>
window.WISH_CATALOG = <?= json_encode($catalog, JSON_UNESCAPED_UNICODE|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT) ?>;
window.renderWishlistPage = function () {
  var root = document.getElementById('wish-root'), fmt = window.fmtPrice;
  var items = Wish.ids.map(function (id) { return window.WISH_CATALOG[id]; }).filter(Boolean);
  if (!items.length) {
    root.innerHTML = '<div class="grid place-items-center rounded-3xl bg-[var(--card)] py-24 text-center">'
      + '<p class="text-lg font-bold text-[var(--text-dim)]">لا منتجات في المفضلة بعد</p>'
      + '<a href="' + window.BASE + '/products.php" class="glow-btn mt-6 inline-block rounded-full px-8 py-3 font-bold">اكتشف المنتجات</a></div>';
    return;
  }
  root.innerHTML = '<div class="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">' + items.map(function (p) {
    var out = p.stock <= 0;
    return '<div class="tilt group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] glass-card">'
      + '<a href="' + window.BASE + '/product.php?slug=' + encodeURIComponent(p.slug) + '" class="relative block aspect-square overflow-hidden bg-[var(--surface-2)]">'
      + '<img src="' + window.safeImageUrl(p.image) + '" alt="" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"></a>'
      + '<div class="flex flex-1 flex-col p-4">'
      + '<a href="' + window.BASE + '/product.php?slug=' + encodeURIComponent(p.slug) + '" class="line-clamp-2 min-h-[2.6rem] text-sm font-semibold leading-snug hover:text-[var(--accent)]">' + window.escapeHtml(p.name) + '</a>'
      + '<div class="mt-3 flex items-end justify-between gap-2"><div class="text-lg font-extrabold text-white">' + window.escapeHtml(fmt(p.price)) + '</div>'
      + '<button ' + (out ? 'disabled' : '') + ' onclick=\'Cart.add(' + window.escapeHtml(JSON.stringify({ id: p.id, name: p.name, price: p.price, image: p.image, slug: p.slug, stock: p.stock })) + ')\' aria-label="أضف إلى السلة" class="grid h-11 w-11 place-items-center rounded-full shadow-md transition ' + (out ? 'cursor-not-allowed bg-[var(--chip)] text-neutral-600' : 'bg-[var(--text)] text-[var(--bg)] hover:bg-[var(--accent)] hover:text-white active:scale-90') + '"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></button>'
      + '</div>'
      + '<button onclick="Wish.toggle({id:' + p.id + '})" class="mt-2 self-start text-xs font-bold text-red-400 hover:underline">إزالة من المفضلة</button>'
      + '</div></div>';
  }).join('') + '</div>';
};
</script>
<?php require APP_ROOT . '/includes/store-footer.php'; ?>
