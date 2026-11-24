<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';
$b = read_json_body();
foreach (['code'] as $field) { if (isset($b[$field]) && !is_string($b[$field])) json_response(['ok'=>false,'error'=>'بيانات غير صالحة'],400); }
$code = trim($b['code'] ?? '');
$subtotal = (float)($b['subtotal'] ?? 0);
if ($code === '') json_response(['ok' => false, 'error' => 'أدخل كود الخصم'], 400);
$r = validate_coupon($code, $subtotal, customer_user()['id'] ?? null);
if (!$r['ok']) json_response(['ok' => false, 'error' => $r['error']], 400);
json_response(['ok' => true, 'discount' => $r['discount'], 'kind' => $r['coupon']['kind'], 'value' => (float)$r['coupon']['value']]);
