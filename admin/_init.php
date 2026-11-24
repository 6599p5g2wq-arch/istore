<?php
// أساس لوحة التحكم: تحقق + ترويسة وتذييل مشتركان
require_once dirname(__DIR__) . '/includes/bootstrap.php';
require_once APP_ROOT . '/includes/auth.php';
require_once APP_ROOT . '/includes/icons.php';

function admin_url(string $path = ''): string { return url('admin/' . ltrim($path, '/')); }

function admin_header(string $title, string $active = ''): void {
    $links = [
        ['index.php', 'لوحة المعلومات', 'layout', true],
        ['products.php', 'المنتجات', 'package'],
        ['categories.php', 'التصنيفات', 'grid'],
        ['brands.php', 'الماركات', 'tag'],
        ['orders.php', 'الطلبات', 'shopping-cart'],
        ['customers.php', 'الزبائن', 'users'],
        ['leads.php', 'السلات المهجورة', 'shopping-bag'],
        ['coupons.php', 'أكواد الخصم', 'ticket'],
        ['loyalty.php', 'الولاء و VIP', 'gift'],
        ['reviews.php', 'التقييمات', 'star'],
        ['stock-alerts.php', 'إشعارات التوفر', 'bell'],
        ['hero.php', 'شرائح الرئيسية', 'image'],
        ['banners.php', 'البنرات الترويجية', 'image'],
        ['shipping.php', 'التوصيل والمدن', 'truck'],
        ['settings.php', 'الإعدادات', 'settings'],
        ['admins.php', 'المشرفون', 'users'],
    ];
    $storeName = setting('store_name', 'آي ستور');
    $badgeNew = (int)(qone("SELECT COUNT(*) c FROM orders WHERE status = 'new'")['c'] ?? 0);
    $badgeLow = (int)(qone("SELECT COUNT(*) c FROM products WHERE active = 1 AND stock <= 5")['c'] ?? 0);
    $badgeLowRev = (int)(qone("SELECT COUNT(*) c FROM reviews WHERE approved = 1 AND rating <= 2")['c'] ?? 0);
    $badgeWaitAlerts = (int)(qone("SELECT COUNT(*) c FROM stock_alerts WHERE notified = 0")['c'] ?? 0);
    $badges = ['orders.php' => [$badgeNew, 'bg-red-500', 'طلبات جديدة'], 'products.php' => [$badgeLow, 'bg-amber-500', 'منتجات مخزونها منخفض'], 'reviews.php' => [$badgeLowRev, 'bg-red-500', 'تقييمات منخفضة معروضة'], 'stock-alerts.php' => [$badgeWaitAlerts, 'bg-amber-500', 'طلبات إشعار منتظرة']];
    $badgeTotal = $badgeNew + $badgeLow;
    ?>
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<?php require APP_ROOT . '/includes/favicon-head.php'; ?>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title><?= e($title) ?> — لوحة تحكم <?= e($storeName) ?></title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Cairo', sans-serif; background: #f4f4f5; color: #18181b; }
  .admin-input { width: 100%; border-radius: 0.9rem; border: 1px solid #d4d4d8; background: #fff; padding: 0.65rem 1rem; font-size: 0.875rem; outline: none; transition: .15s; }
  .admin-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,.15); }
  .admin-btn { display: inline-flex; align-items: center; gap: .4rem; border-radius: 9999px; background: #18181b; color: #fff; font-weight: 700; font-size: .85rem; padding: .55rem 1.3rem; transition: .15s; }
  .admin-btn:hover { background: #3f3f46; }
  .admin-btn-ghost { display: inline-flex; align-items: center; gap: .4rem; border-radius: 9999px; border: 1px solid #d4d4d8; background: #fff; color: #3f3f46; font-weight: 700; font-size: .85rem; padding: .55rem 1.3rem; transition: .15s; }
  .admin-btn-ghost:hover { background: #f4f4f5; }
  .admin-btn-danger { color: #dc2626; } .admin-btn-danger:hover { background: #fef2f2; border-color: #fecaca; }
  .admin-card { border-radius: 1.4rem; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.05); }
  .admin-table th { padding: .7rem 1rem; font-size: .75rem; font-weight: 800; color: #71717a; text-align: right; border-bottom: 1px solid #f4f4f5; white-space: nowrap; }
  .admin-table td { padding: .8rem 1rem; font-size: .85rem; border-bottom: 1px solid #f4f4f5; }
  .admin-table tr:hover td { background: #fafafa; }
  .badge { display: inline-block; border-radius: 9999px; padding: .15rem .7rem; font-size: .72rem; font-weight: 800; }
</style>
</head>
<body>
<div class="flex min-h-screen">
  <aside id="admin-side" class="fixed inset-y-0 right-0 z-40 w-64 translate-x-full bg-neutral-900 p-4 text-white transition-transform lg:static lg:translate-x-0">
    <div class="mb-6 flex items-center justify-between px-2 pt-2">
      <a href="<?= e(admin_url('index.php')) ?>" class="text-lg font-black"><?= e($storeName) ?> <span class="text-xs font-bold text-white/50">إدارة</span></a>
      <button onclick="document.getElementById('admin-side').classList.add('translate-x-full')" class="lg:hidden text-white/60">✕</button>
    </div>
    <nav class="space-y-1">
      <?php foreach ($links as $l): $href = $l[0]; $isActive = $active === $href; ?>
        <a href="<?= e(admin_url($href)) ?>" class="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition <?= $isActive ? 'bg-white text-neutral-900' : 'text-white/70 hover:bg-white/10 hover:text-white' ?>">
          <?= icon($l[2], 18) ?> <span class="flex-1"><?= e($l[1]) ?></span>
          <?php if (!empty($badges[$href]) && $badges[$href][0] > 0): $b = $badges[$href]; ?>
            <span title="<?= e($b[2]) ?>" class="grid min-w-[1.4rem] place-items-center rounded-full px-1.5 py-0.5 text-[11px] font-extrabold leading-none text-white <?= $b[1] ?>"><?= $b[0] > 99 ? '99+' : $b[0] ?></span>
          <?php endif; ?>
        </a>
      <?php endforeach; ?>
      <a href="<?= e(url('index.php')) ?>" target="_blank" class="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"><?= icon('store', 18) ?> عرض المتجر</a>
      <a href="<?= e(admin_url('logout.php')) ?>" class="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-500/10"><?= icon('log-out', 18) ?> تسجيل الخروج</a>
    </nav>
  </aside>
  <div class="flex min-w-0 flex-1 flex-col">
    <header class="sticky top-0 z-30 flex items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
      <button onclick="document.getElementById('admin-side').classList.remove('translate-x-full')" class="relative grid h-10 w-10 place-items-center rounded-xl border border-neutral-200"><?= icon('menu', 20) ?><?php if ($badgeTotal > 0): ?><span class="absolute -left-1 -top-1 grid min-w-[1.25rem] place-items-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] font-extrabold leading-none text-white"><?= $badgeTotal > 99 ? '99+' : $badgeTotal ?></span><?php endif; ?></button>
      <b><?= e($title) ?></b>
    </header>
    <main class="min-w-0 flex-1 p-4 sm:p-8">
    <?php
}

function admin_footer(): void {
    echo "</main></div></div>\n</body>\n</html>";
}

function admin_msg(): void {
    if (!empty($_SESSION['admin_flash'])) {
        echo '<div class="mb-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">' . e($_SESSION['admin_flash']) . '</div>';
        unset($_SESSION['admin_flash']);
    }
    if (!empty($_SESSION['admin_error'])) {
        echo '<div class="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">' . e($_SESSION['admin_error']) . '</div>';
        unset($_SESSION['admin_error']);
    }
}

// إعدادات الولاء/الترحيب/VIP: الحقول المسموحة وحدودها (مجموعة => [مفتاح => [min, max]])
function program_fields(): array {
    return [
        'welcome' => ['welcome_percent' => [1, 90], 'welcome_days' => [1, 3650], 'welcome_max_uses' => [1, 1000]],
        'loyalty' => ['loyalty_per_lyd' => [0.01, 1000], 'loyalty_redeem_points' => [1, 1000000], 'loyalty_redeem_value' => [0.01, 100000]],
        'vip' => ['vip_threshold' => [1, 100000000]],
    ];
}

// يعالج نموذج program_panel عند POST؛ يعيد true إذا تمت معالجته
function handle_program_post(string $backPage): bool {
    if (($_POST['action'] ?? '') !== 'program') return false;
    $group = $_POST['group'] ?? '';
    $fields = program_fields()[$group] ?? null;
    if (!$fields) { flash('مجموعة غير صالحة', true); redirect_admin($backPage); }
    $vals = [$group . '_enabled' => !empty($_POST['enabled']) ? '1' : '0'];
    foreach ($fields as $k => [$min, $max]) {
        $n = $_POST[$k] ?? '';
        if (!is_numeric($n) || (float)$n < $min || (float)$n > $max) { flash('قيمة غير صالحة', true); redirect_admin($backPage); }
        $vals[$k] = (string)(float)$n;
    }
    foreach ($vals as $k => $v) set_setting($k, $v);
    flash('تم حفظ الإعدادات');
    redirect_admin($backPage);
}

// بطاقة إعدادات: $fields = [[key, label, hint, step], ...]
function program_panel(string $group, string $title, string $desc, bool $enabled, array $fields): void {
    ?>
    <form method="post" class="admin-card p-6">
      <input type="hidden" name="action" value="program"><input type="hidden" name="group" value="<?= e($group) ?>">
      <h2 class="font-extrabold"><?= e($title) ?></h2>
      <p class="mt-1 text-xs text-neutral-500"><?= e($desc) ?></p>
      <label class="mt-3 flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="enabled" value="1" <?= $enabled ? 'checked' : '' ?> class="h-4 w-4"> مفعّل</label>
      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <?php foreach ($fields as [$key, $label, $hint, $step]): ?>
          <label class="block text-sm font-bold"><?= e($label) ?>
            <input type="number" name="<?= e($key) ?>" step="<?= e((string)$step) ?>" min="0" required value="<?= e(rtrim(rtrim(number_format((float)setting($key, (string)$hint), 2, '.', ''), '0'), '.')) ?>" class="admin-input mt-1.5">
            <span class="mt-1 block text-[11px] font-normal text-neutral-400">الافتراضي: <?= e((string)$hint) ?></span>
          </label>
        <?php endforeach; ?>
      </div>
      <button class="admin-btn mt-4"><?= icon('check', 16) ?> حفظ</button>
    </form>
    <?php
}

function flash(string $msg, bool $error = false): void {
    $_SESSION[$error ? 'admin_error' : 'admin_flash'] = $msg;
}

function redirect_admin(string $path): void {
    header('Location: ' . admin_url($path));
    exit;
}

// رفع صورة من نموذج — يعيد مسارها النسبي أو ''
function handle_image_upload(string $field): string {
    if (empty($_FILES[$field]) || $_FILES[$field]['error'] !== UPLOAD_ERR_OK) return '';
    $f = $_FILES[$field];
    if ($f['size'] > 4 * 1024 * 1024) return '';
    $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'], true)) return '';
    $name = 'up-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
    $dir = APP_ROOT . '/uploads';
    if (!is_dir($dir)) mkdir($dir, 0775, true);
    if (move_uploaded_file($f['tmp_name'], $dir . '/' . $name)) return 'uploads/' . $name;
    return '';
}
