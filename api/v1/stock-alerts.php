<?php
// POST {product_id, contact} — تنبيه عند التوفر
require_once __DIR__ . '/_api.php';
if (api_method() !== 'POST') api_fail('Method not allowed', 405);
$b = api_body();
$productId = (int)($b['product_id'] ?? 0);
$contact = trim($b['contact'] ?? '');
if (!$productId) api_fail('المنتج غير موجود');
if (!filter_var($contact, FILTER_VALIDATE_EMAIL) && !preg_match('/^[\d+\s-]{8,}$/', $contact)) api_fail('أدخل بريداً إلكترونياً أو رقم هاتف صحيح');
if (!qone('SELECT id FROM products WHERE id = ? AND active = 1', [$productId])) api_fail('المنتج غير موجود', 404);
q('INSERT IGNORE INTO stock_alerts (product_id, contact) VALUES (?, ?)', [$productId, $contact]);
api_ok([], 201);
