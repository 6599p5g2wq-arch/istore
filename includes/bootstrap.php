<?php
// النواة المشتركة: تُضمَّن في أعلى كل صفحة
define('APP_ROOT', dirname(__DIR__));
require APP_ROOT . '/config.php';
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

if (session_status() === PHP_SESSION_NONE) {
    session_name('istore');
    session_start();
}

// Reject cross-site state changes. Native bearer-token API calls have no browser Origin.
if (!str_starts_with(str_replace('\\', '/', $_SERVER['SCRIPT_FILENAME'] ?? ''), str_replace('\\', '/', APP_ROOT) . '/api/v1/') && !in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET','HEAD','OPTIONS'], true)) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $expected = strtolower($_SERVER['HTTP_HOST'] ?? '');
    $parsed = $origin ? parse_url($origin) : false;
    $actual = $parsed && isset($parsed['host']) ? strtolower($parsed['host']).(isset($parsed['port']) ? ':'.$parsed['port'] : '') : '';
    if (($origin !== '' && $actual !== $expected) || ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') {
        http_response_code(403); header('Content-Type: application/json; charset=utf-8'); echo json_encode(['ok'=>false,'error'=>'طلب غير مسموح'],JSON_UNESCAPED_UNICODE); exit;
    }
}
