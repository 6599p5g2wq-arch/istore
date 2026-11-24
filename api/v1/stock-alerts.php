<?php
// POST {product_id, contact} — تنبيه عند التوفر
require_once __DIR__ . '/_api.php';
if (api_method() !== 'POST') api_fail('Method not allowed', 405);
if(rate_limited('stock-mobile:'.client_ip(),20))api_fail('محاولات كثيرة، حاول لاحقا',429);
$b = api_body();
foreach(['phone','contact'] as $field)if(isset($b[$field])&&(!is_string($b[$field])||strlen($b[$field])>254))json_response(['error'=>'بيانات غير صالحة'],400);
$productId = (int)($b['product_id'] ?? 0);
$contact = trim($b['contact'] ?? '');
if (!$productId) api_fail('المنتج غير موجود');
if (!filter_var($contact, FILTER_VALIDATE_EMAIL) && !preg_match('/^[\d+\s-]{8,}$/', $contact)) api_fail('أدخل بريداً إلكترونياً أو رقم هاتف صحيح');
if (!qone('SELECT id FROM products WHERE id = ? AND active = 1', [$productId])) api_fail('المنتج غير موجود', 404);
q('INSERT IGNORE INTO stock_alerts (product_id, contact) VALUES (?, ?)', [$productId, $contact]);
api_ok([], 201);
