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
            $pdo=db(); $pdo->beginTransaction();
            try {
            $locked=qone('SELECT status FROM orders WHERE id=? FOR UPDATE',[$id]); $old=$locked['status'];
            if($old===$new){$pdo->commit();redirect_admin('order.php?id='.$id);}
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
                    $product=qone('SELECT stock,active FROM products WHERE id=? FOR UPDATE',[(int)$it['product_id']]);
                    $variant=$it['variant_id']?qone('SELECT stock FROM product_variants WHERE id=? AND product_id=? FOR UPDATE',[(int)$it['variant_id'],(int)$it['product_id']]):null;
                    if(!$product || !$product['active'] || $product['stock']<$it['qty'] || ($it['variant_id'] && (!$variant || $variant['stock']<$it['qty']))) throw new RuntimeException('لا يمكن إعادة تفعيل الطلب: المخزون غير كافٍ');
                    if ($it['variant_id']) q('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [(int)$it['qty'], (int)$it['variant_id']]);
                    q('UPDATE products SET stock = stock - ? WHERE id = ?', [(int)$it['qty'], (int)$it['product_id']]);
                }
            }
            apply_order_status_effects($id, $old, $new);
            $pdo->commit();
            } catch(Throwable $e) {if($pdo->inTransaction())$pdo->rollBack();flash($e->getMessage(),true);redirect_admin('order.php?id='.$id);}
            // إشعار الزبون بتغير الحالة إن كان عندنا بريده — لا يعطل الحفظ إطلاقاً
            try {
                $custEmail = trim((string)($order['email'] ?? ''));
                if (!$custEmail && !empty($order['customer_id'])) {
                    $c = qone('SELECT email FROM customers WHERE id = ?', [(int)$order['customer_id']]);
                    $custEmail = trim((string)($c['email'] ?? ''));
                }
                if ($custEmail) {
                    $mailItems = array_map(fn($it) => ['name' => $it['name'] . ($it['variant_label'] ? ' — ' . $it['variant_label'] : ''), 'price' => $it['price'], 'qty' => $it['qty']],
                        qall('SELECT name, variant_label, price, qty FROM order_items WHERE order_id = ?', [$id]));
                    send_order_status_email($custEmail, ['code' => $order['code'], 'customer' => $order['customer_name'],
                        'items' => $mailItems, 'total' => $order['total'], 'currency' => setting('currency', '')], $new);
                }
            } catch (Throwable $e) { /* ignore */ }
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

<div class="max-w-3xl">
<div class="no-print flex flex-wrap items-center gap-3">
  <a href="<?= e($backUrl) ?>" class="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-3 font-bold text-neutral-700 shadow-sm transition hover:bg-neutral-100"><?= icon('arrow-right', 18) ?> رجوع للطلبات</a>
  <button type="button" onclick="window.print()" class="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-bold text-neutral-700 shadow-sm transition hover:bg-neutral-100"><?= icon('file-text', 16) ?> طباعة الطلب</button>
  <form method="post" onsubmit="return confirm('حذف «<?= e($order['code']) ?>» نهائياً؟')" class="inline">
    <input type="hidden" name="action" value="delete">
    <button aria-label="حذف" class="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"><?= icon('trash', 15) ?></button>
  </form>
</div>
<?php admin_msg(); ?>
<?php $stCls = ['new' => 'bg-amber-100 text-amber-700', 'confirmed' => 'bg-blue-100 text-blue-700', 'shipped' => 'bg-purple-100 text-purple-700', 'delivered' => 'bg-emerald-100 text-emerald-700', 'cancelled' => 'bg-red-100 text-red-700']; ?>
<div id="print-area">
  <div class="mt-4 flex flex-wrap items-center justify-between gap-4">
    <h1 class="text-2xl font-black sm:text-3xl" dir="ltr"><?= e($order['code']) ?></h1>
    <span class="no-print">
      <form method="post" id="status-form"><select name="status" onchange="this.form.submit()" class="rounded-full border-0 px-3 py-1.5 text-xs font-extrabold outline-none transition <?= $stCls[$order['status']] ?? 'bg-neutral-100' ?>">
        <?php foreach ($valid as $v): ?><option value="<?= $v ?>" <?= $order['status'] === $v ? 'selected' : '' ?>><?= e(order_status_label($v)) ?></option><?php endforeach; ?>
      </select></form>
    </span>
  </div>
  <p class="mt-1 text-sm text-neutral-400"><?= e(format_date($order['created_at'])) ?> · <span class="font-bold text-neutral-500"><?= e(order_status_label($order['status'])) ?></span></p>

  <div class="mt-6 grid gap-5 sm:grid-cols-2">
    <div class="rounded-3xl bg-white p-6 shadow-sm">
      <h2 class="mb-4 font-extrabold">العميل</h2>
      <p class="font-bold"><?= e($order['customer_name']) ?></p>
      <p class="mt-2 flex items-center gap-2 text-sm text-neutral-500"><?= icon('phone', 15) ?> <a dir="ltr" href="tel:<?= e($order['phone']) ?>" class="hover:text-[var(--accent)]"><?= e($order['phone']) ?></a></p>
      <p class="mt-2 flex items-center gap-2 text-sm text-neutral-500"><?= icon('map-pin', 15) ?> <?= e($order['city']) ?><?= $order['address'] ? ' — ' . e($order['address']) : '' ?></p>
      <?php if ($order['notes']): ?><p class="mt-2 flex items-start gap-2 text-sm text-neutral-500"><span class="mt-0.5 shrink-0"><?= icon('edit', 15) ?></span> <?= e($order['notes']) ?></p><?php endif; ?>
      <a href="<?= e($waUrl) ?>" target="_blank" rel="noreferrer" class="no-print mt-4 inline-block rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white transition hover:opacity-90">مراسلة واتساب</a>
    </div>
    <div class="rounded-3xl bg-white p-6 shadow-sm">
      <h2 class="mb-4 font-extrabold">الملخص المالي</h2>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between text-neutral-500"><span>المنتجات</span><span class="font-bold text-black"><?= e(format_price((float)$order['subtotal'])) ?></span></div>
        <?php if ((float)$order['discount'] > 0): ?><div class="flex justify-between text-emerald-600"><span>الخصم<?= $order['coupon_code'] ? ' (' . e($order['coupon_code']) . ')' : '' ?></span><span class="font-bold">- <?= e(format_price((float)$order['discount'])) ?></span></div><?php endif; ?>
        <div class="flex justify-between text-neutral-500"><span>التوصيل</span><span class="font-bold text-black"><?= (float)$order['delivery_fee'] === 0.0 ? 'مجاني' : e(format_price((float)$order['delivery_fee'])) ?></span></div>
        <div class="flex justify-between border-t pt-3 text-base"><span class="font-bold">الإجمالي</span><span class="font-black text-[var(--accent)]"><?= e(format_price((float)$order['total'])) ?></span></div>
      </div>
    </div>
  </div>

  <div class="mt-5 rounded-3xl bg-white p-6 shadow-sm">
    <h2 class="mb-4 font-extrabold">المنتجات (<?= count($items) ?>)</h2>
    <table class="w-full text-sm">
      <thead><tr class="border-b text-right text-xs text-neutral-400"><th class="pb-2 font-bold">المنتج</th><th class="pb-2 font-bold">السعر</th><th class="pb-2 font-bold">الكمية</th><th class="pb-2 font-bold">المجموع</th></tr></thead>
      <tbody>
      <?php foreach ($items as $it): ?>
        <tr class="border-b border-neutral-50 last:border-0">
          <td class="py-2.5"><span class="flex items-center gap-3">
            <?php if (!empty($it['pimage'])): ?><img src="<?= e(img_url($it['pimage'])) ?>" alt="" class="h-11 w-11 shrink-0 rounded-xl bg-neutral-100 object-cover"><?php endif; ?>
            <span class="font-bold"><?= e($it['name']) ?><?php if (!empty($it['variant_label'])): ?><span class="block text-xs font-bold text-neutral-400"><?= e($it['variant_label']) ?></span><?php endif; ?></span>
          </span></td>
          <td class="py-2.5 text-neutral-500"><?= e(format_price((float)$it['price'])) ?></td>
          <td class="py-2.5"><?= (int)$it['qty'] ?></td>
          <td class="py-2.5 font-bold"><?= e(format_price((float)$it['price'] * (int)$it['qty'])) ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<div class="no-print mt-5 grid gap-5 sm:grid-cols-2">
  <div class="rounded-3xl bg-white p-6 shadow-sm">
    <h2 class="mb-4 flex items-center gap-2 font-extrabold"><?= icon('clock', 18, 'text-violet-500') ?> سجل الحالات</h2>
    <?php if (!$timeline): ?>
      <p class="text-sm text-neutral-400">لا سجل بعد</p>
    <?php else: ?>
      <ol class="relative space-y-4 border-r-2 border-neutral-100 pr-4">
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
  <div class="rounded-3xl bg-white p-6 shadow-sm">
    <h2 class="mb-4 flex items-center gap-2 font-extrabold"><?= icon('edit', 18, 'text-amber-500') ?> ملاحظات داخلية</h2>
    <p class="mb-3 text-xs text-neutral-400">تظهر لك أنت فقط — العميل لا يراها</p>
    <form method="post">
      <input type="hidden" name="action" value="notes">
      <textarea name="admin_notes" rows="3" maxlength="2000" placeholder="مثال: اتصل به بعد السادسة مساءً…" class="w-full rounded-2xl border border-neutral-200 bg-[#f5f5f7] p-3 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white"><?= e($order['admin_notes'] ?? '') ?></textarea>
      <div class="mt-2 flex items-center gap-3"><button class="rounded-full bg-neutral-900 px-5 py-2 text-xs font-bold text-white transition hover:opacity-90">حفظ الملاحظة</button></div>
    </form>
  </div>
</div>
</div>

<?php admin_footer(); ?>
