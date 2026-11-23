<?php
require_once __DIR__ . '/_init.php';
admin_bootstrap();
if (admin_user()) redirect_admin('index.php');
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (admin_login(trim($_POST['username'] ?? ''), (string)($_POST['password'] ?? ''))) redirect_admin('index.php');
    $error = 'بيانات الدخول غير صحيحة';
}
$storeName = setting('store_name', 'آي ستور');
?>
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<?php require APP_ROOT . '/includes/favicon-head.php'; ?>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>تسجيل الدخول — لوحة التحكم</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
<style>body{font-family:'Cairo',sans-serif;background:#18181b}</style>
</head>
<body class="grid min-h-screen place-items-center p-4">
  <form method="post" class="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
    <h1 class="text-center text-2xl font-black text-neutral-900"><?= e($storeName) ?></h1>
    <p class="mt-1 text-center text-sm text-neutral-500">لوحة التحكم الإدارية</p>
    <?php if ($error): ?><p class="mt-4 rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-600"><?= e($error) ?></p><?php endif; ?>
    <label class="mt-6 block text-sm font-bold text-neutral-700">اسم المستخدم
      <input name="username" required class="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-violet-600">
    </label>
    <label class="mt-4 block text-sm font-bold text-neutral-700">كلمة المرور
      <input type="password" name="password" required class="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-violet-600">
    </label>
    <button class="mt-6 w-full rounded-full bg-neutral-900 py-3.5 font-bold text-white transition hover:bg-neutral-700">دخول</button>
  </form>
</body>
</html>
