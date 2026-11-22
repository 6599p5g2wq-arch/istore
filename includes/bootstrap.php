<?php
// النواة المشتركة: تُضمَّن في أعلى كل صفحة
define('APP_ROOT', dirname(__DIR__));
require APP_ROOT . '/config.php';
require APP_ROOT . '/includes/db.php';
require APP_ROOT . '/includes/helpers.php';

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
