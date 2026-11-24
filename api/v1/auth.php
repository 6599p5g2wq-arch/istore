<?php
// POST ?action=register | login | logout — حسابات العملاء بتوكن Bearer
require_once __DIR__ . '/_api.php';
if (api_method() !== 'POST') api_fail('Method not allowed', 405);
$action = $_GET['action'] ?? '';
$b = api_body();
foreach (['name','email','phone','password'] as $field) { if (isset($b[$field]) && !is_string($b[$field])) json_response(['ok'=>false,'error'=>'بيانات غير صالحة'],400); }
if(strlen($b['password']??'')>1024 || strlen($b['email']??'')>254)api_fail('بيانات غير صالحة');

if ($action === 'register') {
    if(rate_limited('mobile-register:'.client_ip(),10))api_fail('محاولات كثيرة، حاول لاحقا',429);
    $name = mb_substr(trim($b['name'] ?? ''), 0, 100);
    $email = mb_strtolower(trim($b['email'] ?? ''));
    $phone = trim($b['phone'] ?? '');
    $password = (string)($b['password'] ?? '');
    if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL)) api_fail('الاسم والبريد الإلكتروني مطلوبان');
    if (mb_strlen($password) < 8) api_fail('كلمة المرور 8 أحرف على الأقل');
    $r = customer_register($name, $email, $phone, $password, false);
    if (!$r['ok']) api_fail($r['error']);
    $c = qone('SELECT id, name, email, phone FROM customers WHERE email = ?', [$email]);
    api_ok(['token' => api_issue_token((int)$c['id']), 'customer' => $c], 201);
}
if ($action === 'login') {
    $email = mb_strtolower(trim($b['email'] ?? ''));
    $rk='mobile-login-account:'.hash('sha256',$email);
    if(rate_limited('mobile-login-ip:'.client_ip(),40))api_fail('محاولات كثيرة، حاول لاحقا',429);
    if(rate_limited($rk,8))api_fail('محاولات دخول كثيرة، حاول بعد 15 دقيقة',429);
    $u = qone('SELECT * FROM customers WHERE email = ?', [$email]);
    if (!$u || !password_verify((string)($b['password'] ?? ''), $u['pass_hash'])) api_fail('بيانات الدخول غير صحيحة', 401);
    if (!empty($u['blocked'])) api_fail('هذا الحساب موقوف', 403);
    rate_reset($rk);
    q('UPDATE customers SET last_login = NOW() WHERE id = ?', [(int)$u['id']]);
    api_ok(['token' => api_issue_token((int)$u['id']), 'customer' => ['id' => (int)$u['id'], 'name' => $u['name'], 'email' => $u['email'], 'phone' => $u['phone']]]);
}
if ($action === 'logout') {
    api_logout_token();
    api_ok();
}
api_fail('إجراء غير معروف', 404);
