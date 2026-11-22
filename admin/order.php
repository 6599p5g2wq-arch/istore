<?php
require_once __DIR__ . '/_init.php';
require_admin();
$id = (int)($_GET['id'] ?? 0);
$order = $id ? qone('SELECT * FROM orders WHERE id = ?', [$id]) : null;
if (!$order) { flash('الطلب غير موجود', true); redirect_admin('orders.php'); }
$valid = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];
if ($_SERVER['REQUEST_METHOD'] === 'POST' && in_array($_POST['status'] ?? '', $valid, true)) {
    $old = $order['status'];
    $new = $_POST['status'];
    q('UPDATE orders SET status = ? WHERE id = ?', [$new, $id]);
    // إعادة المخزون عند الإلغاء، وخصمه عند التراجع عن الإلغاء
    if ($new === 'cancelled' && $old !== 'cancelled') {
        foreach (qall('SELECT product_id, qty, variant_id FROM order_items WHERE order_id = ? AND product_id IS NOT NULL', [$id]) as $it) {
            if ($it['variant_id']) q('UPDATE product_variants SET stock = stock + ? WHERE id = ?', [(int)$it['qty'], (int)$it['variant_id']]);
            q('UPDATE products SET stock = stock + ? WHERE id = ?', [(int)$it['qty'], (int)$it['product_id']]);
        }
    } elseif ($old === 'cancelled' && $new !== 'cancelled') {
        foreach (qall('SELECT product_id, qty, variant_id FROM order_items WHERE order_id = ? AND product_id IS NOT NULL', [$id]) as $it) {
            if ($it['variant_id']) q('UPDATE product_variants SET stock = GREATEST(0, stock - ?) WHERE id = ?', [(int)$it['qty'], (int)$it['variant_id']]);
            q('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [(int)$it['qty'], (int)$it['product_id']]);
        }
    }
    // عند التسليم: تنبيه طلبات إشعارات التوفر غير متعلق هنا؛ التسليم يحدّث فقط الحالة
    flash('تم تحديث حالة الطلب إلى «' . order_status_label($new) . '»');
    redirect_admin('order.php?id=' . $id);
}
$items = qall('SELECT * FROM order_items WHERE order_id = ?', [$id]);
// رسالة واتساب جاهزة للعميل: كود الطلب + حالته — قابلة للتعديل في واتساب قبل الإرسال
$waPhone = preg_replace('/\D+/', '', preg_replace('/^0/', '218', $order['phone']));
$waText = 'السلام عليكم ' . $order['customer_name'] . '، معك ' . setting('store_name', 'آي ستور') . ".
"
    . 'طلبك رقم ' . $order['code'] . "
"
    . 'حالة الطلب: ' . order_status_label($order['status']);
$waUrl = 'https://wa.me/' . $waPhone . '?text=' . rawurlencode($waText);
admin_header('طلب ' . $order['code'], 'orders.php');
?>
<div class="flex flex-wrap items-center justify-between gap-3">
  <h1 class="text-2xl font-black sm:text-3xl">طلب <span dir="ltr"><?= e($order['code']) ?></span></h1>
  <a href="<?= e(admin_url('orders.php')) ?>" class="admin-btn-ghost"><?= icon('arrow-left', 16) ?> كل الطلبات</a>
</div>
<?php admin_msg(); ?>
<div class="mt-6 grid gap-5 lg:grid-cols-3">
  <div class="space-y-5 lg:col-span-2">
    <div class="admin-card p-6">
      <h2 class="font-extrabold">المنتجات</h2>
      <table class="admin-table mt-3 w-full">
        <thead><tr><th>المنتج</th><th>السعر</th><th>الكمية</th><th>المجموع</th></tr></thead>
        <tbody>
        <?php foreach ($items as $it): ?>
          <tr><td><?= e($it['name']) ?><?php if (!empty($it['variant_label'])): ?> <span class="text-xs font-bold text-[var(--text-faint)]"><?= e($it['variant_label']) ?></span><?php endif; ?></td><td><?= e(format_price((float)$it['price'])) ?></td><td><?= (int)$it['qty'] ?></td><td class="font-bold"><?= e(format_price((float)$it['price'] * (int)$it['qty'])) ?></td></tr>
        <?php endforeach; ?>
        </tbody>
      </table>
      <div class="mt-4 space-y-1.5 border-t border-neutral-100 pt-4 text-sm">
        <div class="flex justify-between"><span class="text-neutral-500">المجموع الفرعي</span><b><?= e(format_price((float)$order['subtotal'])) ?></b></div>
        <?php if ((float)$order['discount'] > 0): ?><div class="flex justify-between text-emerald-600"><span>الخصم <?= $order['coupon_code'] ? '(' . e($order['coupon_code']) . ')' : '' ?></span><b>-<?= e(format_price((float)$order['discount'])) ?></b></div><?php endif; ?>
        <div class="flex justify-between"><span class="text-neutral-500">التوصيل</span><b><?= (float)$order['delivery_fee'] === 0.0 ? 'مجاني' : e(format_price((float)$order['delivery_fee'])) ?></b></div>
        <div class="flex justify-between border-t border-neutral-100 pt-2 text-lg font-black"><span>الإجمالي</span><span><?= e(format_price((float)$order['total'])) ?></span></div>
      </div>
    </div>
    <?php if ($order['notes']): ?><div class="admin-card p-6"><h2 class="font-extrabold">ملاحظات العميل</h2><p class="mt-2 text-sm leading-7 text-neutral-600"><?= e($order['notes']) ?></p></div><?php endif; ?>
  </div>
  <div class="space-y-5">
    <div class="admin-card p-6">
      <h2 class="font-extrabold">العميل</h2>
      <ul class="mt-3 space-y-2 text-sm text-neutral-700">
        <li class="flex items-center gap-2"><?= icon('user', 16) ?> <?= e($order['customer_name']) ?></li>
        <li class="flex items-center gap-2" dir="ltr"><?= icon('phone', 16) ?> <?= e($order['phone']) ?></li>
        <li class="flex items-center gap-2"><?= icon('map-pin', 16) ?> <?= e($order['city']) ?><?= $order['address'] ? ' — ' . e($order['address']) : '' ?></li>
        <li class="flex items-center gap-2"><?= icon('clock', 16) ?> <?= e(format_date($order['created_at'])) ?></li>
      </ul>
      <a href="<?= e($waUrl) ?>" target="_blank" rel="noopener" class="admin-btn-ghost mt-4 w-full justify-center"><?= icon('whatsapp', 16) ?> مراسلة واتساب</a>
    </div>
    <div class="admin-card p-6">
      <h2 class="font-extrabold">حالة الطلب</h2>
      <p class="mt-2"><span class="badge <?= order_status_class($order['status']) ?>"><?= e(order_status_label($order['status'])) ?></span></p>
      <form method="post" class="mt-4 flex gap-2">
        <select name="status" class="admin-input">
          <?php foreach ($valid as $v): ?><option value="<?= $v ?>" <?= $order['status'] === $v ? 'selected' : '' ?>><?= e(order_status_label($v)) ?></option><?php endforeach; ?>
        </select>
        <button class="admin-btn shrink-0">تحديث</button>
      </form>
    </div>
  </div>
</div>
<?php admin_footer(); ?>
