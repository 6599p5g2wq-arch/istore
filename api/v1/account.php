<?php
// الحساب (توكن): GET — الملف + إحصاءات | PUT {name, phone} — تحديث | PUT {current_password, new_password} — كلمة المرور
require_once __DIR__ . '/_api.php';
$c = api_require_customer();
$m = api_method();

if ($m === 'GET') {
    $stats = qone('SELECT COUNT(*) c, COALESCE(SUM(total),0) t FROM orders WHERE customer_id = ? OR phone = ?', [(int)$c['id'], $c['phone'] ?: "\0"]);
    api_ok(['customer' => $c, 'orders_count' => (int)$stats['c'], 'orders_total' => (float)$stats['t']]);
}
if ($m === 'PUT') {
    $b = api_body();
    if (isset($b['new_password'])) {
        if (!password_verify((string)($b['current_password'] ?? ''), qone('SELECT pass_hash FROM customers WHERE id = ?', [(int)$c['id']])['pass_hash']))
            api_fail('كلمة المرور الحالية غير صحيحة', 403);
        if (mb_strlen((string)$b['new_password']) < 6) api_fail('كلمة المرور 6 أحرف على الأقل');
        q('UPDATE customers SET pass_hash = ? WHERE id = ?', [password_hash((string)$b['new_password'], PASSWORD_DEFAULT), (int)$c['id']]);
        api_ok();
    }
    $name = mb_substr(trim($b['name'] ?? $c['name']), 0, 100);
    $phone = mb_substr(trim($b['phone'] ?? $c['phone']), 0, 30);
    if (!$name) api_fail('الاسم مطلوب');
    q('UPDATE customers SET name = ?, phone = ? WHERE id = ?', [$name, $phone, (int)$c['id']]);
    api_ok(['customer' => ['id' => (int)$c['id'], 'name' => $name, 'email' => $c['email'], 'phone' => $phone]]);
}
api_fail('Method not allowed', 405);
