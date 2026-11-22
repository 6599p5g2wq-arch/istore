<?php
// المفضلة على الخادم (توكن): GET — المحتوى | POST {product_id} — إضافة | DELETE ?product_id= — إزالة
require_once __DIR__ . '/_api.php';
$c = api_require_customer();
$m = api_method();

if ($m === 'GET') {
    $rows = qall('SELECT p.*, c2.slug AS category_slug, c2.name AS category_name, b.slug AS brand_slug, b.name AS brand_name
                  FROM api_wishlist w JOIN products p ON p.id = w.product_id
                  LEFT JOIN categories c2 ON c2.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id
                  WHERE w.customer_id = ? ORDER BY w.id DESC', [(int)$c['id']]);
    api_ok(['items' => array_map('api_product', $rows)]);
}
if ($m === 'POST') {
    $pid = (int)(api_body()['product_id'] ?? 0);
    if (!qone('SELECT id FROM products WHERE id = ? AND active = 1', [$pid])) api_fail('المنتج غير موجود', 404);
    q('INSERT IGNORE INTO api_wishlist (customer_id, product_id) VALUES (?, ?)', [(int)$c['id'], $pid]);
    api_ok();
}
if ($m === 'DELETE') {
    q('DELETE FROM api_wishlist WHERE customer_id = ? AND product_id = ?', [(int)$c['id'], (int)($_GET['product_id'] ?? 0)]);
    api_ok();
}
api_fail('Method not allowed', 405);
