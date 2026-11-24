<?php
// دخول لوحة التحكم (/admin) — جلسات مخزنة في قاعدة البيانات + كوكي HTTP-only

function admin_bootstrap(): void {
    // تنشئ حساب الأدمن الافتراضي من config.php عند أول تشغيل
    $row = qone('SELECT id FROM admin_users LIMIT 1');
    if (!$row) {
        if (ADMIN_PASSWORD==='admin123' && getenv('APP_ENV')!=='development') throw new RuntimeException('Configure a non-default admin password');
        q('INSERT INTO admin_users (username, pass_hash) VALUES (?, ?)', [ADMIN_USERNAME, password_hash(ADMIN_PASSWORD, PASSWORD_DEFAULT)]);
    }
}

require_once __DIR__.'/security.php';
function admin_login(string $username,string $password):bool {return !empty(auth_login_flow('admin',['username'=>$username,'password'=>$password])['ok']);}
function admin_user() {$s=auth_read_session('admin',(string)($_COOKIE['istore_admin']??''));return $s?qone('SELECT id,username FROM admin_users WHERE id=?',[$s['principal']]):null;}
function admin_logout():void {auth_revoke((string)($_COOKIE['istore_admin']??''));unset($_SESSION['istore_admin']);setcookie('istore_admin','',time()-3600,'/');}

function require_admin(): array {
    $u = admin_user();
    if (!$u) { header('Location: ' . url('admin/login.php')); exit; }
    return $u;
}

// ---- لوحة إعدادات الموقع (/control): نظام منفصل تماماً ----

function control_bootstrap(): void {
 if(qone('SELECT id FROM control_users LIMIT 1'))return;
 $c=require __DIR__.'/control-starter.php';q('INSERT IGNORE INTO control_users(username,pass_hash) VALUES(?,?)',[$c['username_hash'],$c['password_hash']]);
}
function control_verify(string $username,string $password) {
    $rows=qall('SELECT id,username,pass_hash FROM control_users LIMIT 2');
    if(count($rows)!==1)return null;$u=$rows[0];
    if(!preg_match('/^\$(argon2id|2[aby])\$/',$u['username']))return null;
    $a=password_verify(trim($username),$u['username']);$b=password_verify($password,$u['pass_hash']);if(str_starts_with($u['pass_hash'],'$2')&&(strlen($password)>72||strlen(trim($username))>72))return null;
    return $a&&$b?$u:null;
}

function control_login(string $username,string $password):bool{return !empty(auth_login_flow('control',['username'=>$username,'password'=>$password])['ok']);}
function control_user(){$s=auth_read_session('control',(string)($_COOKIE['istore_control']??''));$u=$s?qone('SELECT id,username FROM control_users WHERE id=?',[$s['principal']]):null;return $u&&preg_match('/^\$(argon2id|2[aby])\$/',$u['username'])?['id'=>$u['id'],'username'=>'control']:null;}
function control_logout():void{auth_revoke((string)($_COOKIE['istore_control']??''));unset($_SESSION['istore_control']);setcookie('istore_control','',time()-3600,'/');}

function require_control(): array {
    $u = control_user();
    if (!$u) { header('Location: ' . url('control/login.php')); exit; }
    return $u;
}

// ---- حسابات الزبائن ----

function customer_register(string $name, string $email, string $phone, string $password, bool $webLogin=true): array {
    if(strlen($password)>1024 || strlen($email)>254) return ["ok"=>false,"error"=>"بيانات غير صالحة"];
    $ph = normalize_libyan_phone($phone);
    if (!$ph) return ['ok' => false, 'error' => 'رقم الهاتف غير صحيح (مثال: 0912345678)'];
    if (mb_strlen($password) < 8) return ['ok' => false, 'error' => 'كلمة المرور 8 أحرف على الأقل'];
    if (qone('SELECT id FROM customers WHERE email = ?', [$email])) return ['ok' => false, 'error' => 'هذا البريد مسجل من قبل، سجل دخولك'];
    if (qone('SELECT id FROM customers WHERE phone = ?', [$ph])) return ['ok' => false, 'error' => 'هذا الرقم مسجل من قبل، سجل دخولك'];
    q('INSERT INTO customers (name, email, phone, pass_hash) VALUES (?, ?, ?, ?)',
        [$name, $email, $ph, password_hash($password, PASSWORD_DEFAULT)]);
    $newId = (int)(qone('SELECT id FROM customers WHERE email = ?', [$email])['id'] ?? 0);
    if ($newId) { try { create_welcome_coupon($newId); } catch (Throwable $e) { /* لا يمنع التسجيل */ } }
    return $webLogin ? customer_login($email, $password) : ["ok"=>true];
}

// الدخول بالبريد أو برقم الهاتف
function customer_login(string $identifier, string $password): array {
    if(strlen($identifier)>254 || strlen($password)>1024)return ['ok'=>false,'error'=>'بيانات غير صالحة'];
    $identifier = trim($identifier);
    if (str_contains($identifier, '@')) {
        $u = qone('SELECT * FROM customers WHERE email = ?', [mb_strtolower($identifier)]);
    } else {
        $ph = normalize_libyan_phone($identifier);
        $u = qone('SELECT * FROM customers WHERE phone = ? OR phone = ?', [$ph ?? "\0", $identifier]);
    }
    if (!$u || !password_verify($password, $u['pass_hash'])) return ['ok' => false, 'error' => 'بيانات الدخول غير صحيحة'];
    if (!empty($u['blocked'])) return ['ok' => false, 'error' => 'هذا الحساب موقوف، تواصل معنا عبر واتساب'];
    q('UPDATE customers SET last_login = NOW() WHERE id = ?', [$u['id']]);
    $token = random_token();
    q('INSERT INTO customer_sessions (token, customer_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))', [$token, $u['id']]);
    setcookie('istore_customer', $token, [
        'expires' => time() + 30 * 86400, 'path' => '/', 'httponly' => true,
        'samesite' => 'Lax', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
    session_regenerate_id(true);
    $_SESSION['istore_customer'] = $token;
    return ['ok' => true];
}

function customer_user() {
    $token = $_COOKIE['istore_customer'] ?? ($_SESSION['istore_customer'] ?? '');
    if (!$token) return null;
    return qone(
        'SELECT c.id, c.name, c.email, c.phone, c.city, c.address, c.must_change, c.points FROM customer_sessions s JOIN customers c ON c.id = s.customer_id WHERE s.token = ? AND s.expires_at > NOW() AND c.blocked = 0',
        [$token]);
}

function customer_logout(): void {
    $token = $_COOKIE['istore_customer'] ?? ($_SESSION['istore_customer'] ?? '');
    if ($token) q('DELETE FROM customer_sessions WHERE token = ?', [$token]);
    unset($_SESSION['istore_customer']);
    setcookie('istore_customer', '', time() - 3600, '/');
}

// Preserve only the session initiating a customer password change.
function customer_change_password(int $id,string $password,int $mustChange=0,string $keepWeb='',string $keepApi=''):void {
    $pdo=db();$pdo->beginTransaction();try {
      q('UPDATE customers SET pass_hash=?,must_change=? WHERE id=?',[password_hash($password,PASSWORD_DEFAULT),$mustChange,$id]);
      q('DELETE FROM customer_sessions WHERE customer_id=? AND token!=?',[$id,$keepWeb]);
      q('DELETE FROM api_tokens WHERE customer_id=? AND token!=?',[$id,$keepApi]);
      $pdo->commit();
    }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
}
