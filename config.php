<?php
// ============================================================
//  آي ستور — ملف الإعدادات الرئيسي
//  عدّل القيم التالية فقط حسب استضافتك. لا تلمس باقي الملفات.
// ============================================================

// ---- قاعدة البيانات (MySQL) ----
// في XAMPP الافتراضي: المستخدم root وكلمة المرور فارغة
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_NAME', getenv('ISTORE_DB_NAME') ?: 'istore');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_SOCKET', ''); // اتركه فارغاً إلا إذا طُلب منك غير ذلك

// ---- إشعارات الطلبات (Resend) ----
// أنشئ حساباً مجانياً على resend.com وانسخ مفتاح API هنا
define('RESEND_API_KEY', '');
define('RESEND_FROM', ''); // مرسل موثّق في Resend، وإلا يُستخدم مرسل الاختبار
define('NOTIFY_EMAIL', ''); // بريدك لاستقبال إشعار عند كل طلب جديد

// ---- إشعارات تيليجرام ----
// اضبطهما هنا أو من لوحة /control (إعدادات اللوحة تتقدم على هذه القيم)
define('TELEGRAM_BOT_TOKEN', ''); // من @BotFather
define('TELEGRAM_CHAT_ID', ''); // معرف المحادثة مع البوت

// ---- لوحة التحكم (/admin) ----
define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD', 'admin123'); // اضبط كلمة غير افتراضية هنا قبل تشغيل الإنتاج؛ القيم الافتراضية مرفوضة خارج development.

// ---- لوحة إعدادات الموقع (/control) — مستقلة تماماً عن لوحة التحكم ----
// No control credentials in config. Run: php scripts/setup-control.php
// See CONTROL-SECURITY-AR.md. Only salted hashes are stored in control_users.

// Enable only while installing an EMPTY database, then set false and remove install.php.
define('INSTALL_ENABLED', false);
