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
<link rel="stylesheet" href="<?=e(url('assets/css/tailwind.css'))?>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Cairo', sans-serif; background: #f5f5f7; color: #18181b; }
  .admin-input { width: 100%; border-radius: 0.9rem; border: 1px solid #d4d4d8; background: #fff; padding: 0.65rem 1rem; font-size: 0.875rem; outline: none; transition: .15s; }
  .admin-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,.15); }
  .admin-btn { display: inline-flex; align-items: center; gap: .4rem; border-radius: 9999px; background: #18181b; color: #fff; font-weight: 700; font-size: .85rem; padding: .55rem 1.3rem; transition: .15s; }
  .admin-btn:hover { background: #3f3f46; }
  .admin-btn-ghost { display: inline-flex; align-items: center; gap: .4rem; border-radius: 9999px; border: 1px solid #d4d4d8; background: #fff; color: #3f3f46; font-weight: 700; font-size: .85rem; padding: .55rem 1.3rem; transition: .15s; }
  .admin-btn-ghost:hover { background: #f4f4f5; }
  .admin-btn-danger { color: #dc2626; } .admin-btn-danger:hover { background: #fef2f2; border-color: #fecaca; }
  .admin-card { border-radius: 1.5rem; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.05); }
  .admin-table th { padding: .7rem 1rem; font-size: .75rem; font-weight: 800; color: #71717a; text-align: right; border-bottom: 1px solid #f4f4f5; white-space: nowrap; }
  .admin-table td { padding: .8rem 1rem; font-size: .85rem; border-bottom: 1px solid #f4f4f5; }
  .admin-table tr:hover td { background: #fafafa; }
  .badge { display: inline-block; border-radius: 9999px; padding: .15rem .7rem; font-size: .72rem; font-weight: 800; }

.dashboard-stat {display:flex;flex-direction:column;align-items:flex-start}
.dashboard-stat > div{display:flex;flex-direction:column;width:100%;margin-top:18px}
.dashboard-label{order:2;font-size:14px;color:#a3a3a3;margin-top:2px;font-weight:400}
.dashboard-value{order:1;font-size:24px;font-weight:900;line-height:32px}
.dashboard-stat > div > :not(.dashboard-value):not(.dashboard-label){order:3}
.dashboard-stat > span{height:44px;width:44px;margin-bottom:0}
.admin-input{border-radius:12px;border-color:#e5e5e5;padding:10px 12px}
.panel-switch{appearance:none;position:relative;width:44px;height:24px;background:#d4d4d4;border-radius:99px;cursor:pointer}.panel-switch:checked{background:#10b981}.panel-switch:after{content:"";position:absolute;width:20px;height:20px;top:2px;left:2px;border-radius:50%;background:#fff;box-shadow:0 1px 2px #0002}.panel-switch:checked:after{left:22px}
.admin-btn{background:#000;font-size:16px;padding:12px 24px}
</style>
</head>
<body>
<?php $guardPanel='admin';require APP_ROOT.'/includes/session-guard.php'; ?>
<script>window.toggleAdminSide=function(open){document.getElementById('admin-side').classList.toggle('admin-open',open);document.getElementById('admin-overlay').hidden=!open;document.body.style.overflow=open?'hidden':'';};document.addEventListener('keydown',e=>{if(e.key==='Escape')toggleAdminSide(false);});</script>
<style>#admin-side{position:fixed;inset:0 0 0 auto;width:16rem;z-index:30;background:#0a0a0a;color:white;display:flex;flex-direction:column}#admin-overlay{position:fixed;inset:0;background:#0008;z-index:45}#admin-overlay[hidden]{display:none}#admin-menu{display:none}@media(max-width:1023px){#admin-side{display:none;width:18rem;z-index:50}#admin-side.admin-open{display:flex}#admin-menu{display:grid}#admin-main{margin-right:0}}@media(min-width:1024px){#admin-main{margin-right:16rem}#admin-overlay{display:none}}.admin-card{border-radius:1.5rem}</style>
<div id="admin-overlay" hidden onclick="toggleAdminSide(false)"></div>
<button id="admin-menu" onclick="toggleAdminSide(true)" aria-label="القائمة" class="fixed right-4 top-4 z-40 h-11 w-11 place-items-center rounded-full bg-black text-white shadow-lg"><?=icon('menu',20)?><span data-admin-total class="absolute -left-1 -top-1 grid min-w-[1.25rem] place-items-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] font-extrabold leading-none text-white <?=$badgeTotal?'':'hidden'?>"><?=$badgeTotal>99?'99+':$badgeTotal?></span></button>
<aside id="admin-side">
<button onclick="toggleAdminSide(false)" aria-label="إغلاق" class="absolute left-3 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white lg:hidden"><?=icon('x',17)?></button>
<div class="flex items-center gap-2 border-b border-white/10 p-5"><span class="grid h-9 w-9 place-items-center rounded-xl bg-white text-black"><?=icon('store',19)?></span><div><p class="font-extrabold leading-tight"><?=e($storeName)?></p><p class="text-xs text-white/50">لوحة التحكم</p></div></div>
<nav class="flex-1 overflow-y-auto p-3"><?php foreach($links as $l):$href=$l[0];$isActive=$active===$href;$b=$badges[$href]??[0,'bg-amber-500',''];?>
<a href="<?=e(admin_url($href))?>" class="mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition <?=$isActive?'bg-white text-black':'text-white/70 hover:bg-white/10 hover:text-white'?>"><?=icon($l[2],17)?><span class="flex-1"><?=e($l[1])?></span><span data-admin-badge="<?=e($href)?>" title="<?=e($b[2])?>" class="grid min-w-[1.4rem] place-items-center rounded-full px-1.5 py-0.5 text-[11px] font-extrabold leading-none text-white <?=e($b[1])?> <?=$b[0]?'':'hidden'?>"><?=$b[0]>99?'99+':$b[0]?></span></a>
<?php endforeach;?></nav><div class="border-t border-white/10 p-3"><a href="<?=e(url('index.php'))?>" target="_blank" class="mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"><?=icon('store',17)?> عرض المتجر</a><a href="<?=e(admin_url('logout.php'))?>" class="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/10"><?=icon('log-out',17)?> تسجيل الخروج (<?=e(admin_user()['username']??'')?>)</a></div></aside>
<script>(()=>{const update=async()=>{if(document.hidden)return;try{const r=await fetch(<?=json_encode(admin_url('badges.php'))?>);if(!r.ok)return;const d=await r.json();for(const el of document.querySelectorAll('[data-admin-badge]')){const n=Number(d[el.dataset.adminBadge]||0);el.textContent=n>99?'99+':n;el.classList.toggle('hidden',!n);}const total=Number(d['orders.php']||0)+Number(d['products.php']||0);document.querySelectorAll('[data-admin-total]').forEach(el=>{el.textContent=total>99?'99+':total;el.classList.toggle('hidden',!total);});}catch{}};setInterval(update,60000);})();</script>
<div id="admin-main"><main class="mx-auto min-w-0 max-w-6xl flex-1 p-4 pt-20 sm:p-8 lg:pt-8">
    <?php
}

function admin_footer(): void {
    echo "</main></div>\n</body>\n</html>";
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
      <div class="flex items-start justify-between gap-4"><div><h2 class="font-extrabold"><?= e($title) ?></h2><p class="mt-1 text-xs text-neutral-500"><?= e($desc) ?></p></div><label class="shrink-0"><input type="checkbox" name="enabled" value="1" <?= $enabled ? 'checked' : '' ?> class="panel-switch" aria-label="مفعّل"></label></div><p class="mt-2 text-xs font-bold text-neutral-400"><?=$enabled?'مفعّل':'متوقف'?></p>
      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <?php foreach ($fields as [$key, $label, $hint, $step]): ?>
          <label class="block text-sm font-bold"><?= e($label) ?>
            <input type="number" name="<?= e($key) ?>" step="<?= e((string)$step) ?>" min="0" required value="<?= e(rtrim(rtrim(number_format((float)setting($key, (string)$hint), 2, '.', ''), '0'), '.')) ?>" class="admin-input mt-1.5"><span class="mt-1 block text-[11px] font-normal text-neutral-400">الافتراضي: <?=e((string)$hint)?></span>
          </label>
        <?php endforeach; ?>
      </div>
      <button class="admin-btn !text-sm !py-2.5 mt-4"><?= icon('save', 16) ?> حفظ</button>
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
    if(!valid_image_upload($f))return '';
    if ($f['size'] > 4 * 1024 * 1024) return '';
    $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'], true)) return '';
    $name = 'up-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
    $dir = APP_ROOT . '/uploads';
    if (!is_dir($dir)) mkdir($dir, 0775, true);
    if (move_uploaded_file($f['tmp_name'], $dir . '/' . $name)) return 'uploads/' . $name;
    return '';
}

function valid_image_upload(array $f): bool {
 if(($f['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK || ($f['size']??0)>4*1024*1024)return false;
 $ext=strtolower(pathinfo($f['name']??'',PATHINFO_EXTENSION));
 $types=['jpg'=>IMAGETYPE_JPEG,'jpeg'=>IMAGETYPE_JPEG,'png'=>IMAGETYPE_PNG,'webp'=>IMAGETYPE_WEBP,'gif'=>IMAGETYPE_GIF];
 if(defined('IMAGETYPE_AVIF'))$types['avif']=IMAGETYPE_AVIF;
 $info=@getimagesize($f['tmp_name']??'');
 return $info && isset($types[$ext]) && $info[2]===$types[$ext] && $info[0]*$info[1]<=40000000;
}
