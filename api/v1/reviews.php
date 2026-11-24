<?php
// GET ?product_id= — تقييمات منتج | POST — تقييم موثق برقم طلب مسلّم
require_once __DIR__ . '/_api.php';
$m = api_method();
if ($m === 'GET') {
    $pid = (int)($_GET['product_id'] ?? 0);
    if (!$pid) api_fail('حدد المنتج');
    $rows = qall('SELECT customer_name, rating, comment, created_at FROM reviews WHERE product_id = ? AND approved = 1 ORDER BY id DESC LIMIT 50', [$pid]);
    $avg = qone('SELECT ROUND(AVG(rating),1) a, COUNT(*) c FROM reviews WHERE product_id = ? AND approved = 1', [$pid]);
    api_ok(['reviews' => $rows, 'average' => $avg['a'] !== null ? (float)$avg['a'] : null, 'count' => (int)$avg['c']]);
}
if ($m === 'POST') {
    $b = api_body();
foreach (['name','comment','phone','order_code'] as $field) { if (isset($b[$field]) && !is_string($b[$field])) json_response(['ok'=>false,'error'=>'بيانات غير صالحة'],400); }
    $productId = (int)($b['product_id'] ?? 0);
    $name = mb_substr(trim($b['name'] ?? ''), 0, 80);
    $rating = min(5, max(1, (int)($b['rating'] ?? 0)));
    $comment = mb_substr(trim($b['comment'] ?? ''), 0, 1000);
    $phone = trim($b['phone'] ?? '');
    $code = strtoupper(trim($b['order_code'] ?? ''));
    if (!$productId || !$name || !$rating) api_fail('الاسم والتقييم مطلوبان');
    if (!$phone || !$code) api_fail('أدخل رقم الطلب ورقم الهاتف لتوثيق تقييمك');
    $order = qone(
        "SELECT o.id FROM orders o JOIN order_items oi ON oi.order_id = o.id
         WHERE UPPER(o.code) = ? AND o.phone = ? AND o.status = 'delivered' AND oi.product_id = ?",
        [$code, $phone, $productId]);
    if (!$order) api_fail('التقييم متاح فقط لمن استلم هذا المنتج فعلاً — تأكد من رقم الطلب والهاتف', 403);
    if (qone('SELECT id FROM reviews WHERE product_id = ? AND order_code = ?', [$productId, $code])) api_fail('قمت بتقييم هذا المنتج من قبل');
    q('INSERT INTO reviews (product_id, customer_name, rating, comment, phone, order_code, approved) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [$productId, $name, $rating, $comment, $phone, $code]);
    q('UPDATE products SET rating = (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = ? AND approved = 1) WHERE id = ?', [$productId, $productId]);
    api_ok([], 201);
}
api_fail('Method not allowed', 405);
