<?php
// تقييمات موثقة فقط: رقم الطلب + الهاتف يجب أن يطابقا طلباً مسلماً يحوي المنتج
require dirname(__DIR__) . '/includes/bootstrap.php';
$b = read_json_body();
$productId = (int)($b['product_id'] ?? 0);
$name = mb_substr(trim($b['name'] ?? ''), 0, 80);
$rating = min(5, max(1, (int)($b['rating'] ?? 0)));
$comment = mb_substr(trim($b['comment'] ?? ''), 0, 1000);
$phone = trim($b['phone'] ?? '');
$code = strtoupper(trim($b['order_code'] ?? ''));
if (!$productId || !$name || !$rating) json_response(['ok' => false, 'error' => 'الاسم والتقييم مطلوبان'], 400);
if (!$phone || !$code) json_response(['ok' => false, 'error' => 'أدخل رقم الطلب ورقم الهاتف لتوثيق تقييمك'], 400);
$order = qone(
  'SELECT o.id FROM orders o JOIN order_items oi ON oi.order_id = o.id
   WHERE UPPER(o.code) = ? AND o.phone = ? AND o.status = \'delivered\' AND oi.product_id = ?',
  [$code, $phone, $productId]);
if (!$order) json_response(['ok' => false, 'error' => 'التقييم متاح فقط لمن استلم هذا المنتج فعلاً — تأكد من رقم الطلب والهاتف'], 403);
$dup = qone('SELECT id FROM reviews WHERE product_id = ? AND order_code = ?', [$productId, $code]);
if ($dup) json_response(['ok' => false, 'error' => 'قمت بتقييم هذا المنتج من قبل'], 400);
q('INSERT INTO reviews (product_id, customer_name, rating, comment, phone, order_code, approved) VALUES (?, ?, ?, ?, ?, ?, 1)',
  [$productId, $name, $rating, $comment, $phone, $code]);
q('UPDATE products SET rating = (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = ? AND approved = 1) WHERE id = ?',
  [$productId, $productId]);
json_response(['ok' => true]);
