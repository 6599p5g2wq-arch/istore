<?php
// POST ?action=register | login | logout — حسابات العملاء بتوكن Bearer
require_once __DIR__ . '/_api.php';
if (api_method() !== 'POST') api_fail('Method not allowed', 405);
$action = $_GET['action'] ?? '';
$b = api_body();

if ($action === 'register') {
    $name = mb_substr(trim($b['name'] ?? ''), 0, 100);
    $email = mb_strtolower(trim($b['email'] ?? ''));
    $phone = trim($b['phone'] ?? '');
    $password = (string)($b['password'] ?? '');
    if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL)) api_fail('الاسم والبريد الإلكتروني مطلوبان');
    if (mb_strlen($password) < 6) api_fail('كلمة المرور 6 أحرف على الأقل');
    $r = customer_register($name, $email, $phone, $password);
    if (!$r['ok']) api_fail($r['error']);
    $c = qone('SELECT id, name, email, phone FROM customers WHERE email = ?', [$email]);
    api_ok(['token' => api_issue_token((int)$c['id']), 'customer' => $c], 201);
}
if ($action === 'login') {
    $email = mb_strtolower(trim($b['email'] ?? ''));
    $u = qone('SELECT * FROM customers WHERE email = ?', [$email]);
    if (!$u || !password_verify((string)($b['password'] ?? ''), $u['pass_hash'])) api_fail('بيانات الدخول غير صحيحة', 401);
    if (!empty($u['blocked'])) api_fail('هذا الحساب موقوف', 403);
    q('UPDATE customers SET last_login = NOW() WHERE id = ?', [(int)$u['id']]);
    api_ok(['token' => api_issue_token((int)$u['id']), 'customer' => ['id' => (int)$u['id'], 'name' => $u['name'], 'email' => $u['email'], 'phone' => $u['phone']]]);
}
if ($action === 'logout') {
    api_logout_token();
    api_ok();
}
api_fail('إجراء غير معروف', 404);
