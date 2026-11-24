<?php
// الحساب (توكن): GET — الملف + إحصاءات | PUT {name, phone} — تحديث | PUT {current_password, new_password} — كلمة المرور
require_once __DIR__ . '/_api.php';
$c = api_require_customer();
$m = api_method();

if ($m === 'GET') {
    $stats = qone('SELECT COUNT(*) c, COALESCE(SUM(total),0) t FROM orders WHERE customer_id = ?', [(int)$c['id']]);
    api_ok(['customer' => $c, 'orders_count' => (int)$stats['c'], 'orders_total' => (float)$stats['t']]);
}
if ($m === 'PUT') {
    $b = api_body();
foreach (['name','phone','new_password','current_password'] as $field) { if (isset($b[$field]) && !is_string($b[$field])) json_response(['ok'=>false,'error'=>'بيانات غير صالحة'],400); }
    if (isset($b['new_password'])) {
        if (!password_verify((string)($b['current_password'] ?? ''), qone('SELECT pass_hash FROM customers WHERE id = ?', [(int)$c['id']])['pass_hash']))
            api_fail('كلمة المرور الحالية غير صحيحة', 403);
        if (mb_strlen((string)$b['new_password']) < 8) api_fail('كلمة المرور 8 أحرف على الأقل');
        $authHeader=$_SERVER['HTTP_AUTHORIZATION']??'';preg_match('/Bearer\s+([a-f0-9]{64})/i',$authHeader,$match);
        customer_change_password((int)$c['id'],(string)$b['new_password'],0,'',strtolower($match[1]??''));
        api_ok();
    }
    $name = mb_substr(trim($b['name'] ?? $c['name']), 0, 100);
    $phone = normalize_libyan_phone(trim($b['phone'] ?? $c['phone']));
    if (!$name) api_fail('الاسم مطلوب');
    if (!$phone) api_fail('رقم الهاتف غير صحيح');
    if (qone('SELECT id FROM customers WHERE phone = ? AND id != ?', [$phone, (int)$c['id']])) api_fail('هذا الرقم مستخدم في حساب آخر');
    q('UPDATE customers SET name = ?, phone = ? WHERE id = ?', [$name, $phone, (int)$c['id']]);
    api_ok(['customer' => ['id' => (int)$c['id'], 'name' => $name, 'email' => $c['email'], 'phone' => $phone]]);
}
api_fail('Method not allowed', 405);
