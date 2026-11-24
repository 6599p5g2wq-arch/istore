<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
if(rate_limited('stock-alert:'.client_ip(),20))json_response(['error'=>'محاولات كثيرة، حاول لاحقا'],429);
$b = read_json_body();
foreach(['phone','contact'] as $field)if(isset($b[$field])&&(!is_string($b[$field])||strlen($b[$field])>254))json_response(['error'=>'بيانات غير صالحة'],400);
$productId = (int)($b['product_id'] ?? 0);
$contact = trim($b['contact'] ?? '');
if (!$productId) json_response(['ok' => false, 'error' => 'المنتج غير موجود'], 400);
$isEmail = filter_var($contact, FILTER_VALIDATE_EMAIL);
$isPhone = preg_match('/^[\d+\s-]{8,}$/', $contact);
if (!$isEmail && !$isPhone) json_response(['ok' => false, 'error' => 'أدخل بريداً إلكترونياً أو رقم هاتف صحيح'], 400);
if (!qone('SELECT id FROM products WHERE id = ? AND active = 1', [$productId])) json_response(['ok' => false, 'error' => 'المنتج غير موجود'], 404);
q('INSERT IGNORE INTO stock_alerts (product_id, contact) VALUES (?, ?)', [$productId, $contact]);
json_response(['ok' => true]);
