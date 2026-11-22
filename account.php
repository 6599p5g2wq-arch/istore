<?php
require __DIR__ . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';

$error = ''; $tab = $_GET['tab'] ?? 'login';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    if ($action === 'logout') {
        customer_logout();
        header('Location: ' . url('account.php'));
        exit;
    }
    if ($action === 'register') {
        $tab = 'register';
        $name = mb_substr(trim($_POST['name'] ?? ''), 0, 100);
        $email = mb_strtolower(trim($_POST['email'] ?? ''));
        $phone = trim($_POST['phone'] ?? '');
        $password = (string)($_POST['password'] ?? '');
        if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL)) $error = 'الاسم والبريد الإلكتروني مطلوبان';
        elseif (mb_strlen($password) < 6) $error = 'كلمة المرور 6 أحرف على الأقل';
        else {
            $r = customer_register($name, $email, $phone, $password);
            if ($r['ok']) { header('Location: ' . url('account.php')); exit; }
            $error = $r['error'];
        }
    } elseif ($action === 'login') {
        $email = mb_strtolower(trim($_POST['email'] ?? ''));
        $r = customer_login($email, (string)($_POST['password'] ?? ''));
        if ($r['ok']) { header('Location: ' . url('account.php')); exit; }
        $error = $r['error'];
    }
}

$customer = customer_user();
$page_title = 'حسابي';
require APP_ROOT . '/includes/store-header.php';
?>
<?php if (!$customer): ?>
<div class="mx-auto max-w-xl px-4 pt-12 sm:px-6">
  <h1 class="text-center text-3xl font-black sm:text-4xl">حسابي</h1>
  <p class="mt-3 text-center text-[var(--text-dim)]">سجل دخولك لمتابعة طلباتك وبياناتك</p>

  <div class="mx-auto mt-8 grid w-fit grid-cols-2 rounded-full border border-[var(--border)] bg-[var(--card)] p-1 text-sm font-bold">
    <a href="<?= url('account.php?tab=login') ?>" class="rounded-full px-6 py-2 text-center <?= $tab !== 'register' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-dim)]' ?>">دخول</a>
    <a href="<?= url('account.php?tab=register') ?>" class="rounded-full px-6 py-2 text-center <?= $tab === 'register' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-dim)]' ?>">حساب جديد</a>
  </div>

  <?php if ($error): ?><p class="mt-4 rounded-2xl bg-red-500/10 p-3 text-center text-sm font-bold text-red-400"><?= e($error) ?></p><?php endif; ?>

  <?php if ($tab === 'register'): ?>
  <form method="post" class="mt-6 space-y-4 rounded-3xl border border-[var(--border)] bg-[var(--card)] glass-card p-6">
    <input type="hidden" name="action" value="register">
    <label class="block text-sm font-bold"><span class="mb-1.5 flex items-center gap-1.5"><?= icon('user', 15) ?> الاسم الكامل</span>
      <input name="name" required class="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 outline-none transition placeholder:text-neutral-600 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20" placeholder="مثال: محمد أحمد"></label>
    <label class="block text-sm font-bold"><span class="mb-1.5 flex items-center gap-1.5"><?= icon('phone', 15) ?> رقم الهاتف</span>
      <input name="phone" dir="ltr" class="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-left outline-none transition placeholder:text-neutral-600 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20" placeholder="09XXXXXXXX"></label>
    <label class="block text-sm font-bold"><span class="mb-1.5 flex items-center gap-1.5"><?= icon('mail', 15) ?> البريد الإلكتروني</span>
      <input type="email" name="email" required dir="ltr" class="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-left outline-none transition placeholder:text-neutral-600 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20" placeholder="you@example.com"></label>
    <label class="block text-sm font-bold"><span class="mb-1.5 flex items-center gap-1.5"><?= icon('lock', 15) ?> كلمة المرور</span>
      <input type="password" name="password" required minlength="6" dir="ltr" class="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-left outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20" placeholder="6 أحرف على الأقل"></label>
    <button class="glow-btn w-full rounded-full py-3.5 font-bold transition hover:scale-[1.01]">إنشاء الحساب</button>
  </form>
  <?php else: ?>
  <form method="post" class="mt-6 space-y-4 rounded-3xl border border-[var(--border)] bg-[var(--card)] glass-card p-6">
    <input type="hidden" name="action" value="login">
    <label class="block text-sm font-bold"><span class="mb-1.5 flex items-center gap-1.5"><?= icon('mail', 15) ?> البريد الإلكتروني</span>
      <input type="email" name="email" required dir="ltr" class="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-left outline-none transition placeholder:text-neutral-600 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20" placeholder="you@example.com"></label>
    <label class="block text-sm font-bold"><span class="mb-1.5 flex items-center gap-1.5"><?= icon('lock', 15) ?> كلمة المرور</span>
      <input type="password" name="password" required dir="ltr" class="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-left outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20"></label>
    <button class="glow-btn w-full rounded-full py-3.5 font-bold transition hover:scale-[1.01]">تسجيل الدخول</button>
  </form>
  <?php endif; ?>
</div>
<?php else:
  $orders = qall('SELECT * FROM orders WHERE customer_id = ? OR phone = ? ORDER BY id DESC LIMIT 20', [$customer['id'], $customer['phone'] ?: "\0"]);
?>
<div class="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-black">مرحباً، <?= e($customer['name']) ?> 👋</h1>
      <p class="mt-2 flex flex-wrap items-center gap-4 text-sm text-[var(--text-dim)]">
        <span class="flex items-center gap-1.5"><?= icon('mail', 14) ?> <span dir="ltr"><?= e($customer['email']) ?></span></span>
        <?php if ($customer['phone']): ?><span class="flex items-center gap-1.5"><?= icon('phone', 14) ?> <span dir="ltr"><?= e($customer['phone']) ?></span></span><?php endif; ?>
      </p>
    </div>
    <form method="post"><input type="hidden" name="action" value="logout">
      <button class="rounded-full border border-[var(--border)] px-5 py-2 text-sm font-bold text-[var(--text-dim)] transition hover:bg-red-500/10 hover:text-red-400">تسجيل الخروج</button>
    </form>
  </div>

  <h2 class="mt-12 flex items-center gap-2 text-xl font-extrabold"><?= icon('package', 20, 'text-[var(--accent)]') ?> طلباتي</h2>
  <?php if (!$orders): ?>
    <div class="mt-6 rounded-3xl bg-[var(--card)] py-16 text-center">
      <p class="font-bold text-[var(--text-dim)]">لا توجد طلبات بعد</p>
      <a href="<?= url('products.php') ?>" class="glow-btn mt-5 inline-block rounded-full px-8 py-3 font-bold">تسوق الآن</a>
    </div>
  <?php else: ?>
    <ul class="mt-6 space-y-3">
      <?php foreach ($orders as $o): ?>
        <li class="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div>
            <p class="font-bold" dir="ltr"><?= e($o['code']) ?></p>
            <p class="mt-1 text-sm text-[var(--text-faint)]"><?= e(format_date($o['created_at'])) ?> — <?= e($o['city']) ?></p>
          </div>
          <div class="flex items-center gap-3">
            <span class="rounded-full px-3 py-1 text-xs font-bold <?= order_status_class($o['status']) ?>"><?= e(order_status_label($o['status'])) ?></span>
            <b><?= e(format_price((float)$o['total'])) ?></b>
            <a href="<?= url('track.php?code=' . rawurlencode($o['code']) . '&phone=' . rawurlencode($o['phone'])) ?>" class="text-sm font-bold text-[var(--accent)] hover:underline">تتبع</a>
          </div>
        </li>
      <?php endforeach; ?>
    </ul>
  <?php endif; ?>
</div>
<?php endif; ?>
<?php require APP_ROOT . '/includes/store-footer.php'; ?>
