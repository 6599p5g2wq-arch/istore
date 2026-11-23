<?php
require_once dirname(__DIR__) . '/includes/bootstrap.php';
require_once APP_ROOT . '/includes/auth.php';
require_control();

$SECTIONS = [
    ['title' => 'هوية المتجر', 'fields' => [
        ['store_name', 'اسم المتجر'], ['store_tagline', 'الوصف المختصر', true],
        ['footer_text', 'نص الحقوق أسفل الصفحة'],
    ]],
    ['title' => 'التواصل', 'fields' => [
        ['phone', 'رقم الهاتف', false, true], ['whatsapp', 'رقم واتساب (بالصيغة الدولية بدون +)', false, true],
        ['email', 'البريد الإلكتروني', false, true],
    ]],
    ['title' => 'موقع المحل', 'fields' => [
        ['address', 'العنوان'], ['working_hours', 'أوقات العمل'],
        ['map_url', 'رابط الموقع على خرائط قوقل (Google Maps) — اتركه فارغاً لإخفاء الأيقونة والزر', false, true],
    ]],
    ['title' => 'وسائل التواصل الاجتماعي', 'fields' => [
        ['facebook', 'فيسبوك', false, true], ['instagram', 'انستغرام', false, true], ['tiktok', 'تيك توك', false, true],
    ]],
    ['title' => 'التتبع والتكاملات', 'fields' => [
        ['site_url', 'رابط المتجر العلني (للخريطة والإشعارات)', false, true],
        ['meta_pixel_id', 'معرف بكسل فيسبوك (Meta Pixel ID)', false, true],
        ['tiktok_pixel_id', 'معرف بكسل تيك توك (TikTok Pixel ID)', false, true],
        ['ga_id', 'معرف قوقل أناليتكس (G-XXXX)', false, true],
    ]],
    ['title' => 'إشعارات الطلبات (تيليجرام)', 'fields' => [
        ['telegram_chat_id', 'معرف المحادثة (Chat ID)', false, true], ['telegram_bot_token', 'توكن البوت (Bot Token)', false, true],
    ]],
    ['title' => 'وضع الصيانة', 'fields' => [
        ['maintenance_enabled', 'إغلاق المتجر للزوار (يرون رسالة الإغلاق ولا يستطيعون الطلب، والمشرف المسجّل في /admin يتصفح عادياً)', false, false, 'toggle'],
        ['maintenance_message', 'رسالة الإغلاق', true],
    ]],
    ['title' => 'صفحة من نحن', 'fields' => [
        ['about_text', 'نبذة عن المتجر', true], ['delivery_policy', 'سياسة التوصيل', true], ['returns_policy', 'سياسة الاستبدال والاسترجاع', true],
    ]],
];

require_once APP_ROOT . '/includes/intro.php';
$saved = false;
$formErr = '';
$tgTest = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $mu = trim((string)($_POST['map_url'] ?? ''));
    if (!isset($_POST['tg_test']) && $mu !== '' && !(filter_var($mu, FILTER_VALIDATE_URL) && preg_match('~^https?://~i', $mu))) {
        $formErr = 'رابط الخريطة غير صالح: يجب أن يبدأ بـ https://';
    } elseif (isset($_POST['tg_test'])) {
        $tgTest = tg_send('✅ رسالة تجريبية: إشعارات طلبات ' . setting('store_name', 'آي ستور') . ' تعمل بنجاح.');
    } else {
        foreach ($SECTIONS as $sec) {
            foreach ($sec['fields'] as $f) {
                $key = $f[0];
                if (($f[4] ?? '') === 'toggle') { set_setting($key, !empty($_POST[$key]) ? '1' : '0'); continue; }
                if (!array_key_exists($key, $_POST)) continue;
                // التوكن لا يُمسح بقيمة فارغة: يُحدَّث فقط عند كتابة قيمة جديدة
                if ($key === 'telegram_bot_token' && trim((string)$_POST[$key]) === '') continue;
                set_setting($key, trim((string)$_POST[$key]));
            }
        }
        // القسم الافتتاحي
        set_setting('intro_enabled', !empty($_POST['intro_enabled']) ? '1' : '0');
        foreach (['intro_title' => 80, 'intro_pill' => 40, 'intro_tagline' => 300, 'intro_cta_text' => 40] as $k => $max) {
            if (array_key_exists($k, $_POST)) set_setting($k, mb_substr(trim((string)$_POST[$k]), 0, $max));
        }
        if (array_key_exists('intro_cta_link', $_POST)) set_setting('intro_cta_link', intro_safe_link((string)$_POST['intro_cta_link']));
        if (isset($_POST['intro_logo_opacity'])) set_setting('intro_logo_opacity', (string)max(0, min(60, (int)$_POST['intro_logo_opacity'])));
        if (!empty($_POST['intro_logo_delete'])) { intro_delete_logo(); set_setting('intro_logo', ''); }
        if (isset($_FILES['intro_logo_file'])) {
            [$newLogo, $logoErr] = intro_save_logo($_FILES['intro_logo_file']);
            if ($logoErr !== '') $formErr = $logoErr;
            elseif ($newLogo) { intro_delete_logo(); set_setting('intro_logo', $newLogo); }
        }
        $saved = $formErr === '';
    }
}
$tgTokenSaved = setting('telegram_bot_token', '') !== '';
$storeName = setting('store_name', 'آي ستور');
?>
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>إعدادات الموقع — <?= e($storeName) ?></title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  body{font-family:'Cairo',sans-serif;background:#f4f4f5;color:#18181b}
  .c-input{width:100%;border-radius:.9rem;border:1px solid #d4d4d8;background:#fff;padding:.65rem 1rem;font-size:.875rem;outline:none;transition:.15s;color:#18181b}
  .c-input:focus{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.15)}
</style>
</head>
<body>
<header class="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
  <div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
    <b><?= e($storeName) ?> — إعدادات الموقع</b>
    <div class="flex items-center gap-2">
      <a href="<?= e(url('index.php')) ?>" target="_blank" class="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100">عرض المتجر</a>
      <a href="<?= e(url('control/logout.php')) ?>" class="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50">خروج</a>
    </div>
  </div>
</header>
<main class="mx-auto max-w-5xl px-4 py-8">
  <h1 class="text-2xl font-black sm:text-3xl">إعدادات الموقع</h1>
  <p class="mt-1 text-sm text-neutral-500">كل ما يخص هوية الموقع ومعلوماته يتعدل من هنا ويتطبق على المتجر مباشرة</p>
  <?php if ($formErr !== ''): ?><div class="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700"><?= e($formErr) ?></div><?php endif; ?>
  <?php if ($saved): ?><div class="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">تم حفظ الإعدادات بنجاح ✓</div><?php endif; ?>
  <?php if ($tgTest !== null): ?><div class="mt-5 rounded-2xl p-4 text-sm font-bold <?= $tgTest ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700' ?>"><?= $tgTest ? 'وصلت الرسالة التجريبية إلى تيليجرام ✓' : 'فشل الإرسال — راجع التوكن ومعرف المحادثة' ?></div><?php endif; ?>
  <form method="post" enctype="multipart/form-data" class="mt-8 space-y-6">
    <?php $ic = intro_cfg(); $icRaw = settings(); ?>
    <div class="rounded-3xl bg-white p-6 shadow-sm">
      <h2 class="mb-1 text-lg font-extrabold">القسم الافتتاحي (أول شاشة)</h2>
      <p class="mb-5 text-xs text-neutral-500">شاشة واحدة بنفس خلفية الموقع. اترك الحقول فارغة لاستخدام اسم المتجر ووصفه. شرائح العروض وشريط المميزات تُعدَّل من لوحة الإدارة، صفحة «الإعدادات».</p>
      <label class="mb-4 flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="intro_enabled" value="1" <?= $ic['enabled'] ? 'checked' : '' ?> class="h-4 w-4"> إظهار القسم الافتتاحي</label>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block text-sm font-bold">العنوان الكبير<input name="intro_title" value="<?= e($icRaw['intro_title'] ?? '') ?>" maxlength="80" placeholder="<?= e($storeName) ?>" class="c-input mt-1.5"></label>
        <label class="block text-sm font-bold">الشارة الصغيرة (فارغة = إخفاء)<input name="intro_pill" value="<?= e($ic['pill']) ?>" maxlength="40" class="c-input mt-1.5"></label>
        <label class="block text-sm font-bold sm:col-span-2">الوصف المختصر<textarea name="intro_tagline" rows="2" maxlength="300" class="c-input mt-1.5 resize-none"><?= e($icRaw['intro_tagline'] ?? '') ?></textarea></label>
      </div>
      <div class="mt-5 text-sm font-bold">شعار الخلفية (PNG / JPG / WebP / SVG، الشفافية مدعومة)
        <div class="mt-2 flex flex-wrap items-center gap-3">
          <?php if ($ic['logo'] !== ''): ?>
            <img src="<?= e(img_url($ic['logo'])) ?>" alt="" class="h-16 w-16 rounded-xl border border-neutral-200 bg-neutral-100 object-contain p-1">
            <label class="flex items-center gap-1 text-xs font-bold text-red-600"><input type="checkbox" name="intro_logo_delete" value="1"> حذف الشعار</label>
          <?php endif; ?>
          <input type="file" name="intro_logo_file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="text-xs">
        </div>
        <label class="mt-3 block text-xs font-bold">شفافية الشعار: <span id="introOpVal"><?= (int)$ic['opacity'] ?></span>%
          <input type="range" name="intro_logo_opacity" min="0" max="60" value="<?= (int)$ic['opacity'] ?>" class="w-full" oninput="document.getElementById('introOpVal').textContent=this.value"></label>
      </div>
      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <label class="block text-sm font-bold">نص الزر (فارغ = الافتراضي)<input name="intro_cta_text" value="<?= e($icRaw['intro_cta_text'] ?? '') ?>" maxlength="40" class="c-input mt-1.5"></label>
        <label class="block text-sm font-bold">رابط الزر<input name="intro_cta_link" value="<?= e($icRaw['intro_cta_link'] ?? '/products.php') ?>" class="c-input mt-1.5" dir="ltr" style="text-align:left"></label>
      </div>
    </div>
    <?php foreach ($SECTIONS as $sec): ?>
      <div class="rounded-3xl bg-white p-6 shadow-sm">
        <h2 class="mb-5 text-lg font-extrabold"><?= e($sec['title']) ?></h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <?php foreach ($sec['fields'] as $f): [$key, $label, $area, $ltr] = $f + [2 => false, 3 => false]; $toggle = ($f[4] ?? '') === 'toggle'; ?>
            <label class="block text-sm font-bold <?= $area ? 'sm:col-span-2' : '' ?>"><?= e($label) ?>
              <?php if ($toggle): ?>
                <input type="checkbox" name="<?= e($key) ?>" value="1" <?= setting($key, '0') === '1' ? 'checked' : '' ?> class="mt-1.5 h-4 w-4">
              <?php elseif ($area): ?>
                <textarea name="<?= e($key) ?>" rows="3" class="c-input mt-1.5 resize-none" <?= $ltr ? 'dir="ltr" style="text-align:left"' : '' ?>><?= e(setting($key, '')) ?></textarea>
              <?php elseif ($key === 'telegram_bot_token'): ?>
                <input type="password" name="telegram_bot_token" value="" autocomplete="off" placeholder="<?= $tgTokenSaved ? 'محفوظ — اتركه فارغاً للإبقاء عليه' : 'من @BotFather' ?>" class="c-input mt-1.5" dir="ltr" style="text-align:left">
              <?php else: ?>
                <input name="<?= e($key) ?>" value="<?= e(setting($key, '')) ?>" class="c-input mt-1.5" <?= $ltr ? 'dir="ltr" style="text-align:left"' : '' ?>>
              <?php endif; ?>
            </label>
          <?php endforeach; ?>
        </div>
      </div>
    <?php endforeach; ?>
    <div class="sticky bottom-4 flex justify-center">
      <button class="rounded-full bg-neutral-900 px-10 py-3.5 font-bold text-white shadow-lg transition hover:bg-neutral-700">حفظ كل الإعدادات</button>
    </div>
  </form>
  <form method="post" class="mt-4 flex justify-center">
    <input type="hidden" name="tg_test" value="1">
    <button class="rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-sm font-bold text-neutral-600 transition hover:bg-neutral-100">إرسال رسالة تجريبية عبر تيليجرام</button>
  </form>
</main>
</body>
</html>
