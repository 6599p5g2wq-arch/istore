<?php
// مثبت قاعدة البيانات: ينشئ الجداول ويملؤها بالبيانات الأولية.
// Disabled until explicitly enabled in config, POST with session form token only.
require __DIR__ . '/includes/bootstrap.php';
header('Content-Type: text/html; charset=utf-8');
if (!defined('INSTALL_ENABLED') || INSTALL_ENABLED !== true) { http_response_code(403); exit('التثبيت معطل. فعّله مؤقتاً في config.php ثم عطّله واحذف المثبت بعد الانتهاء.'); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>تثبيت المتجر</title><h1>تثبيت قاعدة بيانات جديدة</h1><p>استخدم قاعدة فارغة فقط. لا تشغل هذا المثبت فوق بيانات متجرك الحالي.</p><form method="post"><button type="submit">بدء التثبيت</button></form></html>'; exit; }

$sqlFile = APP_ROOT . '/install.sql';
if (!is_file($sqlFile)) { die('ملف install.sql غير موجود'); }
$sql = file_get_contents($sqlFile);
$statements = array_filter(array_map('trim', explode(";\n", $sql)));
$done = 0; $errors = [];
try {
    $pdo = db();
    if ($pdo->query("SHOW TABLES LIKE 'settings'")->rowCount() && (int)$pdo->query('SELECT COUNT(*) FROM settings')->fetchColumn()>0) { http_response_code(409); exit('القاعدة تحتوي إعدادات بالفعل. استخدم نسخة احتياطية وترقية، وليس إعادة تثبيت.'); }
    foreach ($statements as $st) {
        if ($st === '') continue;
        try { $pdo->exec($st); $done++; } catch (Throwable $e) { $errors[] = $e->getMessage(); }
    }
    require_once APP_ROOT . '/includes/auth.php';
    admin_bootstrap();
    control_bootstrap();
} catch (Throwable $e) {
    die('<div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:60px auto"><h2>تعذر الاتصال بقاعدة البيانات</h2><p>تحقق من بيانات الاتصال في ملف <code>config.php</code> وأن قاعدة البيانات <code>' . e(DB_NAME) . '</code> موجودة.</p><p dir="ltr">' . e('تعذر التثبيت، راجع إعدادات الخادم وسجله') . '</p></div>');
}
?>
<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>التثبيت</title>
<style>body{font-family:sans-serif;background:#f4f4f5;display:grid;place-items:center;min-height:100vh}.card{background:#fff;border-radius:24px;padding:40px;max-width:560px;box-shadow:0 2px 10px rgba(0,0,0,.08)}code{direction:ltr;display:inline-block;background:#f4f4f5;padding:2px 8px;border-radius:8px}</style>
</head><body><div class="card">
<?php if ($errors): ?>
  <h2>اكتمل مع بعض التحذيرات</h2>
  <p>نُفذ <?= $done ?> استعلام. الاستعلامات المتجاوزة (غالباً بيانات موجودة من قبل): <?= count($errors) ?></p>
<?php else: ?>
  <h2>تم التثبيت بنجاح ✅</h2>
  <p>نُفذت <?= $done ?> استعلاماً: الجداول جاهزة والبيانات الأولية محملة.</p>
<?php endif; ?>
<p>المتجر: <a href="index.php">index.php</a><br>
لوحة التحكم: <a href="admin/login.php">admin/login.php</a> (المستخدم وكلمة المرور من <code>config.php</code>)<br>
وحدة الإعدادات: <a href="control/login.php">control/login.php</a></p>
<p><b>مهم:</b> غيّر كلمات المرور الافتراضية في <code>config.php</code> ثم احذف هذا الملف (<code>install.php</code>) بعد التثبيت.</p>
</div></body></html>
