<?php
// إنشاء طلب جديد (الدفع عند الاستلام)
require dirname(__DIR__) . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';
$b = read_json_body();
$name = trim($b['name'] ?? '');
$phone = trim($b['phone'] ?? '');
$city = trim($b['city'] ?? '');
$address = trim($b['address'] ?? '');
$notes = trim($b['notes'] ?? '');
$couponCode = trim($b['coupon'] ?? '');
$items = [];
foreach ((is_array($b['items'] ?? null) ? $b['items'] : []) as $i) {
    if (is_array($i) && (int)($i['id'] ?? 0) > 0 && (int)($i['qty'] ?? 0) > 0) $items[] = ['id' => (int)$i['id'], 'qty' => (int)$i['qty'], 'variant_id' => (int)($i['variant_id'] ?? 0)];
}
if (!$name || !$phone || !$city) json_response(['ok' => false, 'error' => 'يرجى تعبئة الاسم ورقم الهاتف والمدينة'], 400);
if (!$items) json_response(['ok' => false, 'error' => 'السلة فارغة'], 400);
if (mb_strlen($name) > 120 || mb_strlen($phone) > 30 || mb_strlen($address) > 300 || mb_strlen($notes) > 500) {
    json_response(['ok' => false, 'error' => 'بيانات غير صالحة'], 400);
}
$cityRow = qone('SELECT fee FROM cities WHERE name = ? AND active = 1', [$city]);
if (!$cityRow) json_response(['ok' => false, 'error' => 'المدينة غير مدعومة حالياً'], 400);
$freeThreshold = (float)setting('free_shipping_threshold', '0');

$pdo = db();
try {
    $pdo->beginTransaction();
    $subtotal = 0; $lines = [];
    foreach ($items as $it) {
        $p = qone('SELECT id, name, price, stock, active, options FROM products WHERE id = ? FOR UPDATE', [$it['id']]);
        if (!$p || !$p['active']) throw new RuntimeException('منتج غير متوفر: #' . $it['id']);
        $qty = min($it['qty'], 99);
        $variant = null;
        if (parse_options($p['options'] ?? '')) {
            $variant = $it['variant_id'] ? qone('SELECT * FROM product_variants WHERE id = ? AND product_id = ? FOR UPDATE', [$it['variant_id'], $p['id']]) : null;
            if (!$variant) throw new RuntimeException('يرجى اختيار مواصفات «' . $p['name'] . '» من صفحة المنتج');
            if ((int)$variant['stock'] < $qty) throw new RuntimeException('الكمية المطلوبة من «' . $p['name'] . ' — ' . $variant['label'] . '» غير متوفرة (المتوفر: ' . $variant['stock'] . ')');
        } elseif ($p['stock'] < $qty) {
            throw new RuntimeException('الكمية المطلوبة من «' . $p['name'] . '» غير متوفرة (المتوفر: ' . $p['stock'] . ')');
        }
        $unitPrice = $variant && $variant['price'] !== null ? (float)$variant['price'] : (float)$p['price'];
        $subtotal += $unitPrice * $qty;
        $lines[] = ['id' => (int)$p['id'], 'name' => $p['name'], 'price' => $unitPrice, 'qty' => $qty,
                    'variant_id' => $variant ? (int)$variant['id'] : null, 'variant_label' => $variant ? (string)$variant['label'] : ''];
    }
    $discount = 0;
    if ($couponCode !== '') {
        $v = validate_coupon($couponCode, $subtotal);
        if (!$v['ok']) throw new RuntimeException($v['error']);
        $discount = $v['discount'];
    }
    $deliveryFee = ($freeThreshold > 0 && $subtotal - $discount >= $freeThreshold) ? 0 : (float)$cityRow['fee'];
    $code = 'IST-' . strtoupper(bin2hex(random_bytes(3)));
    $customer = customer_user();
    q('INSERT INTO orders (code, customer_name, phone, city, address, notes, subtotal, discount, coupon_code, delivery_fee, total, customer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [$code, $name, $phone, $city, $address, $notes, $subtotal, $discount, $discount > 0 ? strtoupper($couponCode) : '', $deliveryFee, $subtotal - $discount + $deliveryFee, $customer['id'] ?? null]);
    $orderId = (int)$pdo->lastInsertId();
    foreach ($lines as $l) {
        q('INSERT INTO order_items (order_id, product_id, name, price, qty, variant_id, variant_label) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [$orderId, $l['id'], $l['name'], $l['price'], $l['qty'], $l['variant_id'], $l['variant_label']]);
        if ($l['variant_id']) q('UPDATE product_variants SET stock = GREATEST(0, stock - ?) WHERE id = ?', [$l['qty'], $l['variant_id']]);
        q('UPDATE products SET stock = stock - ? WHERE id = ?', [$l['qty'], $l['id']]);
    }
    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    json_response(['ok' => false, 'error' => $e->getMessage()], 400);
}
// اكتمال الطلب: حذف أي سلة مهجورة لهذا الهاتف
q('DELETE FROM cart_leads WHERE phone = ?', [$phone]);
// إشعار بريدي دون أن يعطل إتمام الطلب
try {
    notify_new_order(['code' => $code, 'customer' => $name, 'phone' => $phone, 'city' => $city, 'address' => $address, 'notes' => $notes,
        'items' => $lines, 'subtotal' => $subtotal, 'discount' => $discount, 'couponCode' => $couponCode, 'deliveryFee' => $deliveryFee,
        'total' => $subtotal - $discount + $deliveryFee]);
} catch (Throwable $e) { /* ignore */ }
json_response(['ok' => true, 'code' => $code]);
