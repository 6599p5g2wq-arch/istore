<?php
// سلة التطبيق على الخادم (تتطلب توكن):
// GET — المحتوى | POST {product_id, qty} — إضافة/تحديث | PUT {product_id, qty} — كمية | DELETE ?product_id= — حذف | DELETE — تفريغ
require_once __DIR__ . '/_api.php';
$c = api_require_customer();
$m = api_method();

if ($m === 'GET') {
    $rows = qall('SELECT ac.product_id, ac.qty, p.*, c2.slug AS category_slug, c2.name AS category_name, b.slug AS brand_slug, b.name AS brand_name
                  FROM api_cart ac JOIN products p ON p.id = ac.product_id
                  LEFT JOIN categories c2 ON c2.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id
                  WHERE ac.customer_id = ? ORDER BY ac.id', [(int)$c['id']]);
    $items = []; $total = 0;
    foreach ($rows as $r) {
        $p = api_product($r);
        $p['qty'] = (int)$r['qty'];
        $total += $p['price'] * $p['qty'];
        $items[] = $p;
    }
    api_ok(['items' => $items, 'total' => $total]);
}

if ($m === 'POST' || $m === 'PUT') {
    $b = api_body();
    $pid = (int)($b['product_id'] ?? 0);
    $qty = max(1, min(99, (int)($b['qty'] ?? 1)));
    $p = $pid ? qone('SELECT id, stock, active FROM products WHERE id = ?', [$pid]) : null;
    if (!$p || !$p['active']) api_fail('المنتج غير موجود', 404);
    if ($qty > (int)$p['stock']) api_fail('الكمية المطلوبة غير متوفرة (المتوفر: ' . (int)$p['stock'] . ')');
    if ($m === 'POST') {
        q('INSERT INTO api_cart (customer_id, product_id, qty) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE qty = LEAST(qty + VALUES(qty), 99)', [(int)$c['id'], $pid, $qty]);
    } else {
        q('INSERT INTO api_cart (customer_id, product_id, qty) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE qty = VALUES(qty)', [(int)$c['id'], $pid, $qty]);
    }
    api_ok();
}

if ($m === 'DELETE') {
    $pid = (int)($_GET['product_id'] ?? 0);
    if ($pid) q('DELETE FROM api_cart WHERE customer_id = ? AND product_id = ?', [(int)$c['id'], $pid]);
    else q('DELETE FROM api_cart WHERE customer_id = ?', [(int)$c['id']]);
    api_ok();
}
api_fail('Method not allowed', 405);
