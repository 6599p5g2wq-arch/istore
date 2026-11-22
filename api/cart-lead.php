<?php
// تسجيل السلة المهجورة: بدأت عملية شراء ولم تكتمل
require dirname(__DIR__) . '/includes/bootstrap.php';
$b = read_json_body();
$phone = trim($b['phone'] ?? '');
$items = array_slice(is_array($b['items'] ?? null) ? $b['items'] : [], 0, 30);
$total = (float)($b['total'] ?? 0);
if (!preg_match('/^[\d+\s-]{8,}$/', $phone) || !$items) json_response(['ok' => false, 'error' => 'بيانات غير مكتملة'], 400);
q('INSERT INTO cart_leads (phone, items, total) VALUES (?, ?, ?)
   ON DUPLICATE KEY UPDATE items = VALUES(items), total = VALUES(total), reminded = 0',
  [$phone, json_encode($items, JSON_UNESCAPED_UNICODE), $total]);
json_response(['ok' => true]);
