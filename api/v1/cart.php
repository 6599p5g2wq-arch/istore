<?php
// سلة التطبيق على الخادم (تتطلب توكن):
// GET — المحتوى | POST {product_id, variant_id, qty} — إضافة/تحديث | PUT — كمية | DELETE ?product_id=&variant_id= — حذف | DELETE — تفريغ
require_once __DIR__ . '/_api.php';
$c = api_require_customer();
$m = api_method();

if ($m === 'GET') {
    $rows = qall('SELECT ac.product_id, ac.variant_id, ac.qty, p.*, c2.slug AS category_slug, c2.name AS category_name, b.slug AS brand_slug, b.name AS brand_name,
                         pv.label AS variant_label, pv.price AS variant_price, pv.stock AS variant_stock, pv.image AS variant_image
                  FROM api_cart ac JOIN products p ON p.id = ac.product_id
                  LEFT JOIN product_variants pv ON pv.id = ac.variant_id
                  LEFT JOIN categories c2 ON c2.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id
                  WHERE ac.customer_id = ? ORDER BY ac.id', [(int)$c['id']]);
    $items = []; $total = 0;
    foreach ($rows as $r) {
        $p = api_product($r);
        if ((int)$r['variant_id'] > 0) {
            $p['variant_id'] = (int)$r['variant_id'];
            $p['variant_label'] = (string)($r['variant_label'] ?? '');
            if ($r['variant_price'] !== null) $p['price'] = (float)$r['variant_price'];
            if ($r['variant_stock'] !== null) $p['stock'] = (int)$r['variant_stock'];
            if (!empty($r['variant_image'])) $p['image'] = img_url($r['variant_image']);
        }
        $p['qty'] = (int)$r['qty'];
        $total += $p['price'] * $p['qty'];
        $items[] = $p;
    }
    api_ok(['items' => $items, 'total' => $total]);
}

if ($m === 'POST' || $m === 'PUT') {
    $b = api_body();
    $pid = (int)($b['product_id'] ?? 0);
    $vid = (int)($b['variant_id'] ?? 0);
    $qty = max(1, min(99, (int)($b['qty'] ?? 1)));
    $p = $pid ? qone('SELECT id, stock, active, options FROM products WHERE id = ?', [$pid]) : null;
    if (!$p || !$p['active']) api_fail('المنتج غير موجود', 404);
    if (parse_options($p['options'] ?? '')) {
        $v = $vid ? qone('SELECT id, stock FROM product_variants WHERE id = ? AND product_id = ?', [$vid, $pid]) : null;
        if (!$v) api_fail('يرجى اختيار مواصفات المنتج', 400);
        if ($qty > (int)$v['stock']) api_fail('الكمية المطلوبة غير متوفرة (المتوفر: ' . (int)$v['stock'] . ')');
        $vid = (int)$v['id'];
    } else {
        $vid = 0;
        if ($qty > (int)$p['stock']) api_fail('الكمية المطلوبة غير متوفرة (المتوفر: ' . (int)$p['stock'] . ')');
    }
    if ($m === 'POST') {
        q('INSERT INTO api_cart (customer_id, product_id, variant_id, qty) VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE qty = LEAST(qty + VALUES(qty), 99)', [(int)$c['id'], $pid, $vid, $qty]);
    } else {
        q('INSERT INTO api_cart (customer_id, product_id, variant_id, qty) VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE qty = VALUES(qty)', [(int)$c['id'], $pid, $vid, $qty]);
    }
    api_ok();
}

if ($m === 'DELETE') {
    $pid = (int)($_GET['product_id'] ?? 0);
    $vid = (int)($_GET['variant_id'] ?? 0);
    if ($pid) q('DELETE FROM api_cart WHERE customer_id = ? AND product_id = ? AND variant_id = ?', [(int)$c['id'], $pid, $vid]);
    else q('DELETE FROM api_cart WHERE customer_id = ?', [(int)$c['id']]);
    api_ok();
}
api_fail('Method not allowed', 405);
