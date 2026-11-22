<?php
require __DIR__ . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';
$page_title = 'سلة التسوق';
require APP_ROOT . '/includes/store-header.php';
?>
<div class="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
  <h1 class="text-3xl font-black sm:text-4xl">سلة التسوق</h1>
  <div id="cart-page-root" class="mt-8"></div>
</div>
<script>
window.renderCartPage = function () {
  var root = document.getElementById('cart-page-root');
  var items = Cart.items, fmt = window.fmtPrice;
  if (!items.length) {
    root.innerHTML = '<div class="grid place-items-center rounded-3xl bg-[var(--card)] py-24 text-center">'
      + '<p class="text-lg font-bold text-[var(--text-dim)]">سلتك فارغة</p>'
      + '<a href="' + window.BASE + '/products.php" class="glow-btn mt-6 inline-block rounded-full px-8 py-3 font-bold">ابدأ التسوق</a></div>';
    return;
  }
  var rows = items.map(function (i) {
    return '<div class="flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center">'
      + '<a href="' + window.BASE + '/product.php?slug=' + encodeURIComponent(i.slug) + '" class="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-[var(--surface-2)]"><img src="' + i.image + '" alt="" class="h-full w-full object-cover"></a>'
      + '<div class="flex-1"><a href="' + window.BASE + '/product.php?slug=' + encodeURIComponent(i.slug) + '" class="font-bold leading-snug hover:text-[var(--accent)]">' + i.name + '</a>'
      + (i.variant_label ? '<p class="mt-0.5 text-xs font-bold text-[var(--text-faint)]">' + i.variant_label + '</p>' : '')
      + '<p class="mt-1 text-sm text-[var(--text-faint)]">' + fmt(i.price) + '</p></div>'
      + '<div class="flex items-center gap-3">'
      + '<div class="flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5">'
      + '<button onclick="Cart.setQty(\'' + Cart.key(i) + '\',' + (i.qty + 1) + ')" class="grid h-7 w-7 place-items-center rounded-full hover:bg-[var(--chip)]">+</button>'
      + '<span class="min-w-8 text-center font-bold">' + i.qty + '</span>'
      + '<button onclick="Cart.setQty(\'' + Cart.key(i) + '\',' + (i.qty - 1) + ')" class="grid h-7 w-7 place-items-center rounded-full hover:bg-[var(--chip)]">−</button>'
      + '</div>'
      + '<span class="w-28 text-left text-lg font-extrabold">' + fmt(i.price * i.qty) + '</span>'
      + '<button onclick="Cart.remove(\'' + Cart.key(i) + '\')" aria-label="حذف" class="grid h-9 w-9 place-items-center rounded-full text-[var(--text-faint)] hover:bg-red-500/10 hover:text-red-400">✕</button>'
      + '</div></div>';
  }).join('');
  root.innerHTML = '<div class="space-y-4">' + rows + '</div>'
    + '<div class="mt-6 flex flex-col items-center justify-between gap-4 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 sm:flex-row">'
    + '<div class="text-xl font-extrabold">الإجمالي: <span class="text-[var(--accent)]">' + fmt(Cart.total()) + '</span></div>'
    + '<a href="' + window.BASE + '/checkout.php" class="glow-btn rounded-full px-10 py-3.5 font-bold transition hover:scale-[1.02]">إتمام الطلب</a></div>';
};
</script>
<?php require APP_ROOT . '/includes/store-footer.php'; ?>
