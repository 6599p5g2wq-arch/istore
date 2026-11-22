<?php
// دخول لوحة التحكم (/admin) — جلسات مخزنة في قاعدة البيانات + كوكي HTTP-only

function admin_bootstrap(): void {
    // تنشئ حساب الأدمن الافتراضي من config.php عند أول تشغيل
    $row = qone('SELECT id FROM admin_users LIMIT 1');
    if (!$row) {
        q('INSERT INTO admin_users (username, pass_hash) VALUES (?, ?)', [ADMIN_USERNAME, password_hash(ADMIN_PASSWORD, PASSWORD_DEFAULT)]);
    }
}

function admin_login(string $username, string $password): bool {
    admin_bootstrap();
    $u = qone('SELECT * FROM admin_users WHERE username = ?', [$username]);
    if (!$u || !password_verify($password, $u['pass_hash'])) return false;
    $token = random_token();
    q('INSERT INTO sessions (token, admin_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))', [$token, $u['id']]);
    setcookie('istore_admin', $token, [
        'expires' => time() + 30 * 86400, 'path' => '/', 'httponly' => true,
        'samesite' => 'Lax', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
    $_SESSION['istore_admin'] = $token;
    return true;
}

function admin_user() {
    $token = $_COOKIE['istore_admin'] ?? ($_SESSION['istore_admin'] ?? '');
    if (!$token) return null;
    return qone(
        'SELECT a.id, a.username FROM sessions s JOIN admin_users a ON a.id = s.admin_id WHERE s.token = ? AND s.expires_at > NOW()',
        [$token]);
}

function admin_logout(): void {
    $token = $_COOKIE['istore_admin'] ?? ($_SESSION['istore_admin'] ?? '');
    if ($token) q('DELETE FROM sessions WHERE token = ?', [$token]);
    unset($_SESSION['istore_admin']);
    setcookie('istore_admin', '', time() - 3600, '/');
}

function require_admin(): array {
    $u = admin_user();
    if (!$u) { header('Location: ' . url('admin/login.php')); exit; }
    return $u;
}

// ---- لوحة إعدادات الموقع (/control): نظام منفصل تماماً ----

function control_bootstrap(): void {
    $row = qone('SELECT id FROM control_users LIMIT 1');
    if (!$row) {
        q('INSERT INTO control_users (username, pass_hash) VALUES (?, ?)', [CONTROL_USERNAME, password_hash(CONTROL_PASSWORD, PASSWORD_DEFAULT)]);
    }
}

function control_login(string $username, string $password): bool {
    control_bootstrap();
    $u = qone('SELECT * FROM control_users WHERE username = ?', [$username]);
    if (!$u || !password_verify($password, $u['pass_hash'])) return false;
    $token = random_token();
    q('INSERT INTO control_sessions (token, control_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))', [$token, $u['id']]);
    setcookie('istore_control', $token, [
        'expires' => time() + 30 * 86400, 'path' => '/', 'httponly' => true,
        'samesite' => 'Lax', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
    $_SESSION['istore_control'] = $token;
    return true;
}

function control_user() {
    $token = $_COOKIE['istore_control'] ?? ($_SESSION['istore_control'] ?? '');
    if (!$token) return null;
    return qone(
        'SELECT c.id, c.username FROM control_sessions s JOIN control_users c ON c.id = s.control_id WHERE s.token = ? AND s.expires_at > NOW()',
        [$token]);
}

function control_logout(): void {
    $token = $_COOKIE['istore_control'] ?? ($_SESSION['istore_control'] ?? '');
    if ($token) q('DELETE FROM control_sessions WHERE token = ?', [$token]);
    unset($_SESSION['istore_control']);
    setcookie('istore_control', '', time() - 3600, '/');
}

function require_control(): array {
    $u = control_user();
    if (!$u) { header('Location: ' . url('control/login.php')); exit; }
    return $u;
}

// ---- حسابات الزبائن ----

function customer_register(string $name, string $email, string $phone, string $password): array {
    $exists = qone('SELECT id FROM customers WHERE email = ?', [$email]);
    if ($exists) return ['ok' => false, 'error' => 'هذا البريد مسجل من قبل، سجل دخولك'];
    q('INSERT INTO customers (name, email, phone, pass_hash) VALUES (?, ?, ?, ?)',
        [$name, $email, $phone, password_hash($password, PASSWORD_DEFAULT)]);
    return customer_login($email, $password);
}

function customer_login(string $email, string $password): array {
    $u = qone('SELECT * FROM customers WHERE email = ?', [$email]);
    if (!$u || !password_verify($password, $u['pass_hash'])) return ['ok' => false, 'error' => 'بيانات الدخول غير صحيحة'];
    $token = random_token();
    q('INSERT INTO customer_sessions (token, customer_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))', [$token, $u['id']]);
    setcookie('istore_customer', $token, [
        'expires' => time() + 30 * 86400, 'path' => '/', 'httponly' => true,
        'samesite' => 'Lax', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
    $_SESSION['istore_customer'] = $token;
    return ['ok' => true];
}

function customer_user() {
    $token = $_COOKIE['istore_customer'] ?? ($_SESSION['istore_customer'] ?? '');
    if (!$token) return null;
    return qone(
        'SELECT c.id, c.name, c.email, c.phone FROM customer_sessions s JOIN customers c ON c.id = s.customer_id WHERE s.token = ? AND s.expires_at > NOW()',
        [$token]);
}

function customer_logout(): void {
    $token = $_COOKIE['istore_customer'] ?? ($_SESSION['istore_customer'] ?? '');
    if ($token) q('DELETE FROM customer_sessions WHERE token = ?', [$token]);
    unset($_SESSION['istore_customer']);
    setcookie('istore_customer', '', time() - 3600, '/');
}
