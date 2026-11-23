<?php
// POST التحقق من كوبون: {code, subtotal}
require_once __DIR__ . '/_api.php';
if (api_method() !== 'POST') api_fail('Method not allowed', 405);
$b = api_body();
$code = trim($b['code'] ?? '');
$subtotal = (float)($b['subtotal'] ?? 0);
if ($code === '') api_fail('أدخل كود الخصم');
$r = validate_coupon($code, $subtotal, api_customer()['id'] ?? null);
if (!$r['ok']) api_fail($r['error']);
api_ok(['discount' => $r['discount'], 'kind' => $r['coupon']['kind'], 'value' => (float)$r['coupon']['value']]);
