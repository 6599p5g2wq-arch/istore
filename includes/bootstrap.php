<?php
// النواة المشتركة: تُضمَّن في أعلى كل صفحة
define('APP_ROOT', dirname(__DIR__));
require APP_ROOT . '/config.php';
date_default_timezone_set('Africa/Tripoli');
require APP_ROOT . '/includes/db.php';
require APP_ROOT . '/includes/helpers.php';
require APP_ROOT . '/includes/variants.php';
require APP_ROOT . '/includes/telegram.php';

// رابط جذر الموقع تلقائياً (يعمل داخل مجلد فرعي في XAMPP أو على جذر الدومين)
if (!defined('BASE_URL')) {
    $doc = isset($_SERVER['DOCUMENT_ROOT']) ? realpath($_SERVER['DOCUMENT_ROOT']) : '';
    $app = realpath(APP_ROOT);
    $base = '';
    if ($doc && $app && strpos($app, $doc) === 0) {
        $base = str_replace('\\', '/', substr($app, strlen($doc)));
    }
    define('BASE_URL', rtrim($base, '/'));
}

function url(string $path = ''): string {
    return BASE_URL . '/' . ltrim($path, '/');
}

set_exception_handler(function(Throwable $e):void {error_log('Store request failed: '.get_class($e));http_response_code(500);header('Content-Type: application/json; charset=utf-8');echo json_encode(['error'=>'تعذر إتمام الطلب']);});
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: no-store');
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.use_strict_mode','1');
    ini_set('session.use_only_cookies','1');
    session_set_cookie_params(['httponly'=>true,'secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off','samesite'=>'Lax','path'=>'/']);
    session_name('istore');
    session_start();
}

if(empty($_SESSION['form_csrf']))$_SESSION['form_csrf']=bin2hex(random_bytes(24));
ob_start(function(string $html):string {
 if(stripos((string)($_SERVER['HTTP_ACCEPT']??''),'text/html')===false)return $html;
 return preg_replace_callback('/<form\b[^>]*\bmethod\s*=\s*[\"\']?post[\"\']?[^>]*>/i',function($m){return $m[0].'<input type="hidden" hidden name="form_csrf" value="'.htmlspecialchars($_SESSION['form_csrf'],ENT_QUOTES,'UTF-8').'">';},$html);
});
if ((int)($_SERVER['CONTENT_LENGTH']??0)>12*1024*1024) {http_response_code(413);exit;}
// Reject cross-site state changes. Native bearer-token API calls have no browser Origin.
if (!str_starts_with(str_replace('\\', '/', $_SERVER['SCRIPT_FILENAME'] ?? ''), str_replace('\\', '/', APP_ROOT) . '/api/v1/') && !in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET','HEAD','OPTIONS'], true)) {
    $type=strtolower(explode(';',$_SERVER['CONTENT_TYPE']??'')[0]);
    if(in_array($type,['application/x-www-form-urlencoded','multipart/form-data'],true) && (!is_string($_POST['form_csrf']??null)||!hash_equals($_SESSION['form_csrf'],$_POST['form_csrf']))){http_response_code(403);exit('انتهت صلاحية النموذج');}
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $expected = strtolower($_SERVER['HTTP_HOST'] ?? '');
    $parsed = $origin ? parse_url($origin) : false;
    $actual = $parsed && isset($parsed['host']) ? strtolower($parsed['host']).(isset($parsed['port']) ? ':'.$parsed['port'] : '') : '';
    if (($origin === '' || $actual !== $expected) || ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') {
        http_response_code(403); header('Content-Type: application/json; charset=utf-8'); echo json_encode(['ok'=>false,'error'=>'طلب غير مسموح'],JSON_UNESCAPED_UNICODE); exit;
    }
}

// Logout is a state change too, even though the existing UI navigates with GET.
if (preg_match('#/(admin|control)/logout\.php$#',$_SERVER['SCRIPT_NAME']??'') && ($_SERVER['REQUEST_METHOD']??'GET')==='GET') {
 $site=$_SERVER['HTTP_SEC_FETCH_SITE']??'';$ref=parse_url($_SERVER['HTTP_REFERER']??'');$host=strtolower($_SERVER['HTTP_HOST']??'');$rh=isset($ref['host'])?strtolower($ref['host']).(isset($ref['port'])?':'.$ref['port']:''):'';
 if($site==='cross-site'||($site!=='same-origin'&&$rh!==$host)){http_response_code(403);exit;}
}
