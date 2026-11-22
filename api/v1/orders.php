<?php
// الطلبات:
// POST {name, phone, city, address, notes, coupon, items:[{id, qty}]} — إنشاء (زائر أو مسجل، يُربط بالحساب مع توكن)
// GET (توكن) — طلبات الحساب | GET ?code=&phone= — تتبع زائر
require_once __DIR__ . '/_api.php';
$m = api_method();

if ($m === 'GET') {
    $code = strtoupper(trim($_GET['code'] ?? ''));
    $phone = trim($_GET['phone'] ?? '');
    if ($code && $phone) {
        $norm = fn($p) => preg_replace('/^\+?218/', '0', preg_replace('/[^\d+]/', '', $p));
        $o = qone('SELECT * FROM orders WHERE UPPER(code) = ?', [$code]);
        if (!$o || $norm($o['phone']) !== $norm($phone)) api_fail('لم يتم العثور على طلب بهذه البيانات', 404);
        $items = qall('SELECT name, qty, price FROM order_items WHERE order_id = ?', [(int)$o['id']]);
        api_ok(['order' => [
            'code' => $o['code'], 'status' => $o['status'], 'status_label' => order_status_label($o['status']),
            'city' => $o['city'], 'subtotal' => (float)$o['subtotal'], 'discount' => (float)$o['discount'],
            'delivery_fee' => (float)$o['delivery_fee'], 'total' => (float)$o['total'],
            'created_at' => $o['created_at'], 'items' => $items,
        ]]);
    }
    $c = api_require_customer();
    $orders = qall('SELECT * FROM orders WHERE customer_id = ? OR phone = ? ORDER BY id DESC LIMIT 50', [(int)$c['id'], $c['phone'] ?: "\0"]);
    api_ok(['orders' => array_map(fn($o) => [
        'code' => $o['code'], 'status' => $o['status'], 'status_label' => order_status_label($o['status']),
        'city' => $o['city'], 'total' => (float)$o['total'], 'created_at' => $o['created_at'],
    ], $orders)]);
}

if ($m === 'POST') {
    $b = api_body();
    $name = trim($b['name'] ?? '');
    $phone = trim($b['phone'] ?? '');
    $city = trim($b['city'] ?? '');
    $address = trim($b['address'] ?? '');
    $notes = trim($b['notes'] ?? '');
    $couponCode = trim($b['coupon'] ?? '');
    $items = [];
    foreach ((is_array($b['items'] ?? null) ? $b['items'] : []) as $i) {
        if (is_array($i) && (int)($i['id'] ?? 0) > 0 && (int)($i['qty'] ?? 0) > 0) $items[] = ['id' => (int)$i['id'], 'qty' => (int)$i['qty']];
    }
    if (!$name || !$phone || !$city) api_fail('يرجى تعبئة الاسم ورقم الهاتف والمدينة');
    if (!$items) api_fail('السلة فارغة');
    if (mb_strlen($name) > 120 || mb_strlen($phone) > 30 || mb_strlen($address) > 300 || mb_strlen($notes) > 500) api_fail('بيانات غير صالحة');
    $cityRow = qone('SELECT fee FROM cities WHERE name = ? AND active = 1', [$city]);
    if (!$cityRow) api_fail('المدينة غير مدعومة حالياً');
    $freeThreshold = (float)setting('free_shipping_threshold', '0');
    $customer = api_customer();

    $pdo = db();
    try {
        $pdo->beginTransaction();
        $subtotal = 0; $lines = [];
        foreach ($items as $it) {
            $p = qone('SELECT id, name, price, stock, active FROM products WHERE id = ? FOR UPDATE', [$it['id']]);
            if (!$p || !$p['active']) throw new RuntimeException('منتج غير متوفر: #' . $it['id']);
            $qty = min($it['qty'], 99);
            if ($p['stock'] < $qty) throw new RuntimeException('الكمية المطلوبة من «' . $p['name'] . '» غير متوفرة (المتوفر: ' . $p['stock'] . ')');
            $subtotal += (float)$p['price'] * $qty;
            $lines[] = ['id' => (int)$p['id'], 'name' => $p['name'], 'price' => (float)$p['price'], 'qty' => $qty];
        }
        $discount = 0;
        if ($couponCode !== '') {
            $v = validate_coupon($couponCode, $subtotal);
            if (!$v['ok']) throw new RuntimeException($v['error']);
            $discount = $v['discount'];
        }
        $deliveryFee = ($freeThreshold > 0 && $subtotal - $discount >= $freeThreshold) ? 0 : (float)$cityRow['fee'];
        $code = 'IST-' . strtoupper(bin2hex(random_bytes(3)));
        q('INSERT INTO orders (code, customer_name, phone, city, address, notes, subtotal, discount, coupon_code, delivery_fee, total, customer_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [$code, $name, $phone, $city, $address, $notes, $subtotal, $discount, $discount > 0 ? strtoupper($couponCode) : '', $deliveryFee, $subtotal - $discount + $deliveryFee, $customer['id'] ?? null]);
        $orderId = (int)$pdo->lastInsertId();
        foreach ($lines as $l) {
            q('INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES (?, ?, ?, ?, ?)', [$orderId, $l['id'], $l['name'], $l['price'], $l['qty']]);
            q('UPDATE products SET stock = stock - ? WHERE id = ?', [$l['qty'], $l['id']]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        api_fail($e->getMessage());
    }
    if ($customer) q('DELETE FROM api_cart WHERE customer_id = ?', [(int)$customer['id']]);
    q('DELETE FROM cart_leads WHERE phone = ?', [$phone]);
    try {
        notify_new_order(['code' => $code, 'customer' => $name, 'phone' => $phone, 'city' => $city, 'address' => $address, 'notes' => $notes,
            'items' => $lines, 'subtotal' => $subtotal, 'discount' => $discount, 'couponCode' => $couponCode, 'deliveryFee' => $deliveryFee,
            'total' => $subtotal - $discount + $deliveryFee]);
    } catch (Throwable $e) { /* ignore */ }
    api_ok(['code' => $code, 'total' => $subtotal - $discount + $deliveryFee, 'delivery_fee' => $deliveryFee, 'discount' => $discount], 201);
}
api_fail('Method not allowed', 405);
