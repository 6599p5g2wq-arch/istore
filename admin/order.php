<?php
require_once __DIR__ . '/_init.php';
require_admin();
$id = (int)($_GET['id'] ?? 0);
$order = $id ? qone('SELECT * FROM orders WHERE id = ?', [$id]) : null;
if (!$order) { flash('الطلب غير موجود', true); redirect_admin('orders.php'); }
$valid = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? 'status';

    // حذف الطلب نهائياً (يحذف عناصره وسجل حالاته بالتبعية)
    if ($action === 'delete') {
        q('DELETE FROM orders WHERE id = ?', [$id]);
        flash('تم حذف الطلب «' . $order['code'] . '» نهائياً');
        redirect_admin('orders.php');
    }

    // ملاحظات الأدمن الداخلية (لا تظهر للعميل)
    if ($action === 'notes') {
        q('UPDATE orders SET admin_notes = ? WHERE id = ?', [mb_substr(trim((string)($_POST['admin_notes'] ?? '')), 0, 2000), $id]);
        flash('تم حفظ الملاحظة');
        redirect_admin('order.php?id=' . $id);
    }

    if (in_array($_POST['status'] ?? '', $valid, true)) {
        $old = $order['status'];
        $new = $_POST['status'];
        if ($new !== $old) {
            q('UPDATE orders SET status = ? WHERE id = ?', [$new, $id]);
            q('INSERT INTO order_status_log (order_id, status) VALUES (?, ?)', [$id, $new]);
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
            apply_order_status_effects($id, $old, $new);
            flash('تم تحديث حالة الطلب إلى «' . order_status_label($new) . '»');
        }
        redirect_admin('order.php?id=' . $id);
    }
}

$items = qall('SELECT oi.*, p.image AS pimage FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?', [$id]);
$timeline = qall('SELECT status, created_at FROM order_status_log WHERE order_id = ? ORDER BY id ASC', [$id]);

// الرجوع يحافظ على حالة القائمة (فلتر الحالة) إن جاء المستخدم منها
$backUrl = admin_url('orders.php');
$ref = $_SERVER['HTTP_REFERER'] ?? '';
if ($ref && preg_match('~^https?://' . preg_quote($_SERVER['HTTP_HOST'] ?? '', '~') . '~', $ref) && str_contains($ref, '/admin/orders.php')) {
    $backUrl = $ref;
}
// رسالة واتساب جاهزة للعميل: كود الطلب + حالته — قابلة للتعديل في واتساب قبل الإرسال
$waPhone = preg_replace('/\D+/', '', preg_replace('/^0/', '218', $order['phone']));
$waText = 'السلام عليكم ' . $order['customer_name'] . '، معك ' . setting('store_name', 'آي ستور') . ".
"
    . 'طلبك رقم ' . $order['code'] . "
"
    . 'حالة الطلب: ' . order_status_label($order['status']);
$waUrl = 'https://wa.me/' . $waPhone . '?text=' . rawurlencode($waText);
$dotCls = ['new' => 'bg-amber-400', 'confirmed' => 'bg-blue-500', 'shipped' => 'bg-purple-500', 'delivered' => 'bg-emerald-500', 'cancelled' => 'bg-red-500'];
admin_header('طلب ' . $order['code'], 'orders.php');
?>
<style>
@media print {
  body * { visibility: hidden !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute !important; inset-inline: 0; top: 0; padding: 24px; background: #fff; }
  .no-print { display: none !important; }
}
</style>

<div class="flex flex-wrap items-center justify-between gap-3">
  <h1 class="text-2xl font-black sm:text-3xl">طلب <span dir="ltr"><?= e($order['code']) ?></span></h1>
  <div class="no-print flex flex-wrap items-center gap-2">
    <button onclick="window.print()" class="admin-btn-ghost">طباعة الطلب</button>
    <form method="post" onsubmit="return confirm('حذف الطلب «<?= e($order['code']) ?>» نهائياً؟')" class="inline">
      <input type="hidden" name="action" value="delete">
      <button class="admin-btn-ghost !text-red-600"><?= icon('trash', 16) ?> حذف</button>
    </form>
    <a href="<?= e($backUrl) ?>" class="admin-btn-ghost"><?= icon('arrow-left', 16) ?> رجوع للطلبات</a>
  </div>
</div>
<?php admin_msg(); ?>

<div id="print-area" class="mt-6 grid gap-5 lg:grid-cols-3">
  <div class="space-y-5 lg:col-span-2">
    <div class="admin-card p-6">
      <h2 class="font-extrabold">المنتجات</h2>
      <table class="admin-table mt-3 w-full">
        <thead><tr><th>المنتج</th><th>السعر</th><th>الكمية</th><th>المجموع</th></tr></thead>
        <tbody>
        <?php foreach ($items as $it): ?>
          <tr>
            <td>
              <span class="flex items-center gap-3">
                <?php if (!empty($it['pimage'])): ?><img src="<?= e(img_url($it['pimage'])) ?>" class="h-11 w-11 shrink-0 rounded-xl bg-neutral-100 object-cover" alt=""><?php endif; ?>
                <span><?= e($it['name']) ?><?php if (!empty($it['variant_label'])): ?> <span class="block text-xs font-bold text-[var(--text-faint)]"><?= e($it['variant_label']) ?></span><?php endif; ?></span>
              </span>
            </td>
            <td><?= e(format_price((float)$it['price'])) ?></td><td><?= (int)$it['qty'] ?></td><td class="font-bold"><?= e(format_price((float)$it['price'] * (int)$it['qty'])) ?></td>
          </tr>
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
      <a href="<?= e($waUrl) ?>" target="_blank" rel="noopener" class="admin-btn-ghost no-print mt-4 w-full justify-center"><?= icon('whatsapp', 16) ?> مراسلة واتساب</a>
    </div>
    <div class="admin-card p-6">
      <h2 class="font-extrabold">حالة الطلب</h2>
      <p class="mt-2"><span class="badge <?= order_status_class($order['status']) ?>"><?= e(order_status_label($order['status'])) ?></span></p>
      <form method="post" class="no-print mt-4 flex gap-2">
        <select name="status" class="admin-input">
          <?php foreach ($valid as $v): ?><option value="<?= $v ?>" <?= $order['status'] === $v ? 'selected' : '' ?>><?= e(order_status_label($v)) ?></option><?php endforeach; ?>
        </select>
        <button class="admin-btn shrink-0">تحديث</button>
      </form>
    </div>
  </div>
</div>

<div class="no-print mt-5 grid gap-5 lg:grid-cols-2">
  <div class="admin-card p-6">
    <h2 class="flex items-center gap-2 font-extrabold"><?= icon('clock', 18, 'text-violet-500') ?> سجل الحالات</h2>
    <?php if (!$timeline): ?>
      <p class="mt-3 text-sm text-neutral-400">لا سجل بعد</p>
    <?php else: ?>
      <ol class="relative mt-4 space-y-4 border-r-2 border-neutral-100 pr-4">
        <?php foreach ($timeline as $t): ?>
          <li class="relative">
            <span class="absolute -right-[23px] top-1 h-3 w-3 rounded-full border-2 border-white <?= $dotCls[$t['status']] ?? 'bg-neutral-300' ?>"></span>
            <p class="text-sm font-bold"><?= e(order_status_label($t['status'])) ?></p>
            <p class="text-xs text-neutral-400"><?= e(format_date($t['created_at'])) ?></p>
          </li>
        <?php endforeach; ?>
      </ol>
    <?php endif; ?>
  </div>
  <div class="admin-card p-6">
    <h2 class="flex items-center gap-2 font-extrabold"><?= icon('edit', 18, 'text-amber-500') ?> ملاحظات داخلية</h2>
    <p class="mt-1 text-xs text-neutral-400">تظهر لك أنت فقط — العميل لا يراها</p>
    <form method="post" class="mt-3">
      <input type="hidden" name="action" value="notes">
      <textarea name="admin_notes" rows="3" maxlength="2000" placeholder="مثال: اتصل به بعد السادسة مساءً…" class="admin-input w-full"><?= e($order['admin_notes'] ?? '') ?></textarea>
      <button class="admin-btn mt-2">حفظ الملاحظة</button>
    </form>
  </div>
</div>

<?php admin_footer(); ?>
