<?php
require_once dirname(__DIR__) . '/includes/bootstrap.php';
require_once APP_ROOT . '/includes/auth.php';
require_control();
require_once APP_ROOT.'/includes/icons.php';

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
    ['title' => 'روابط التواصل الاجتماعي', 'fields' => [
        ['facebook', 'فيسبوك', false, true], ['instagram', 'انستغرام', false, true], ['tiktok', 'تيك توك', false, true],
    ]],
    ['title' => 'التتبع والتحليلات', 'fields' => [
        ['site_url', 'رابط المتجر العلني (للخريطة والإشعارات)', false, true],
        ['meta_pixel_id', 'معرف بكسل فيسبوك (Meta Pixel ID)', false, true],
        ['tiktok_pixel_id', 'معرف بكسل تيك توك (TikTok Pixel ID)', false, true],
        ['ga_id', 'معرف قوقل أناليتكس (G-XXXX)', false, true],
    ]],
    ['title' => 'إشعارات البريد (Resend)', 'note' => 'تُرسل رسائل الطلبات (للمتجر وللزبون) وإشعارات التوفر عبر خدمة Resend. مهم: حتى يُوثَّق دومينك في Resend، تصل الرسائل فقط إلى بريد مالك حساب Resend نفسه. بعد توثيق الدومين ضع عنوان مرسل على دومينه مثل المتجر <orders@yourdomain.com>.', 'fields' => [
        ['resend_api_key', 'مفتاح Resend (API Key)', false, true],
        ['resend_from', 'عنوان المرسل — مثال: المتجر <orders@yourdomain.com>', false, true],
        ['notify_email', 'إيميل مختلف لاستلام الطلبات (اختياري — الافتراضي بريد التواصل أعلاه)', false, true],
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
    // Validate the full payload before writing any setting.
    foreach($SECTIONS as $section)foreach($section['fields'] as $field){$key=$field[0];if(isset($_POST[$key])&&(!is_string($_POST[$key])||mb_strlen($_POST[$key])>5000)){$formErr='قيمة غير صالحة أو تتجاوز 5000 حرف';}}
    foreach(['intro_title','intro_pill','intro_tagline','intro_cta_text','intro_cta_link','intro_logo_opacity'] as $key)if(isset($_POST[$key])&&!is_string($_POST[$key]))$formErr='قيمة غير صالحة';
    $mu = is_string($_POST['map_url']??null)?trim($_POST['map_url']):'';
    if($formErr!==''){} elseif (!isset($_POST['tg_test']) && $mu !== '' && !(filter_var($mu, FILTER_VALIDATE_URL) && preg_match('~^https?://~i', $mu))) {
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
                if (($key === 'telegram_bot_token' || $key === 'resend_api_key') && trim((string)$_POST[$key]) === '') continue;
                if(!is_string($_POST[$key])||mb_strlen($_POST[$key])>5000){$formErr='قيمة غير صالحة أو تتجاوز 5000 حرف';continue;}set_setting($key, trim($_POST[$key]));
            }
        }
        // القسم الافتتاحي
        set_setting('intro_enabled', !empty($_POST['intro_enabled']) ? '1' : '0');
        foreach (['intro_title' => 60, 'intro_pill' => 40, 'intro_tagline' => 160, 'intro_cta_text' => 30] as $k => $max) {
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
$resendKeySaved = setting('resend_api_key', '') !== '';
$storeName = setting('store_name', 'آي ستور');
?>
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<?php require APP_ROOT.'/includes/favicon-head.php'; ?>
<style>[hidden]{display:none!important}</style>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>إعدادات الموقع — <?= e($storeName) ?></title>
<link rel="stylesheet" href="<?=e(url('assets/css/tailwind.css'))?>">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  body{font-family:'Cairo',sans-serif;background:#f5f5f7;color:#18181b}
  .c-input{width:100%;border-radius:.9rem;border:1px solid #d4d4d8;background:#fff;padding:.65rem 1rem;font-size:.875rem;outline:none;transition:.15s;color:#18181b}
  .c-input:focus{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.15)}
</style>
</head>
<body>
<header class="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur">
  <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
    <div class="flex items-center gap-2.5 font-extrabold"><span class="grid h-9 w-9 place-items-center rounded-xl bg-black text-white"><?=icon('sliders',17)?></span>إعدادات موقع <?=e($storeName)?></div>
    <div class="flex items-center gap-2">
      <a href="<?= e(url('index.php')) ?>" target="_blank" class="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100">عرض المتجر</a>
      <a href="<?= e(url('control/logout.php')) ?>" class="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50">خروج</a>
    </div>
  </div>
</header>
<?php $guardPanel='control';require APP_ROOT.'/includes/session-guard.php'; ?>
<main class="mx-auto max-w-6xl p-4 sm:p-8">
  <h1 class="text-2xl font-black sm:text-3xl">إعدادات الموقع</h1><p class="mt-1 text-sm text-neutral-500">كل ما يخص هوية الموقع ومعلوماته يتعدل من هنا ويتطبق على المتجر مباشرة</p>
  <?php if ($formErr !== ''): ?><div class="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700"><?= e($formErr) ?></div><?php endif; ?>
  <?php if ($saved): ?><div class="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">تم حفظ الإعدادات بنجاح ✓</div><?php endif; ?>
  <?php if ($tgTest !== null): ?><div class="mt-5 rounded-2xl p-4 text-sm font-bold <?= $tgTest ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700' ?>"><?= $tgTest ? 'وصلت الرسالة التجريبية إلى تيليجرام ✓' : 'فشل الإرسال — راجع التوكن ومعرف المحادثة' ?></div><?php endif; ?>
  <?php require APP_ROOT.'/includes/control-credentials-ui.php'; ?>
  <?php $secPanel='control';require APP_ROOT.'/includes/security-settings.php'; ?>
<form method="post" enctype="multipart/form-data" class="mt-8 max-w-3xl space-y-6">
    <?php $ic = intro_cfg(); $icRaw = settings(); ?>
    <?php foreach ($SECTIONS as $sec): ?>
      <div class="rounded-3xl bg-white p-6 shadow-sm">
        <h2 class="<?= isset($sec['note']) ? '' : 'mb-5 ' ?>text-lg font-extrabold"><?= e($sec['title']) ?></h2>
        <?php if (isset($sec['note'])): ?><p class="mb-5 mt-1 text-xs leading-6 text-neutral-500"><?= e($sec['note']) ?></p><?php endif; ?>
        <div class="space-y-4">
          <?php foreach ($sec['fields'] as $f): [$key, $label, $area, $ltr] = $f + [2 => false, 3 => false]; $toggle = ($f[4] ?? '') === 'toggle'; ?>
            <label class="block text-sm font-bold <?= $area ? 'sm:col-span-2' : '' ?>"><?= e($label) ?>
              <?php if ($toggle): ?>
                <input type="checkbox" name="<?= e($key) ?>" value="1" <?= setting($key, '0') === '1' ? 'checked' : '' ?> class="mt-1.5 h-4 w-4">
              <?php elseif ($area): ?>
                <textarea name="<?= e($key) ?>" rows="3" class="c-input mt-1.5 resize-none" <?= $ltr ? 'dir="ltr" style="text-align:left"' : '' ?>><?= e(setting($key, '')) ?></textarea>
              <?php elseif ($key === 'telegram_bot_token'): ?>
                <input type="password" name="telegram_bot_token" value="" autocomplete="off" placeholder="<?= $tgTokenSaved ? 'محفوظ — اتركه فارغاً للإبقاء عليه' : 'من @BotFather' ?>" class="c-input mt-1.5" dir="ltr" style="text-align:left">
              <?php elseif ($key === 'resend_api_key'): ?>
                <input type="password" name="resend_api_key" value="" autocomplete="off" placeholder="<?= $resendKeySaved ? 'محفوظ — اتركه فارغاً للإبقاء عليه' : 're_xxxxxxxxxxxx' ?>" class="c-input mt-1.5" dir="ltr" style="text-align:left">
              <?php else: ?>
                <input name="<?= e($key) ?>" value="<?= e(setting($key, '')) ?>" class="c-input mt-1.5" <?= $ltr ? 'dir="ltr" style="text-align:left"' : '' ?>>
              <?php endif; ?>
            </label>
          <?php endforeach; ?>
        </div>
      </div>
    <?php endforeach; ?>
    <div class="rounded-3xl bg-white p-6 shadow-sm">
      <h2 class="mb-1 text-lg font-extrabold">القسم الافتتاحي (أول شاشة)</h2>
      <p class="mb-5 text-xs text-neutral-500">شاشة واحدة بنفس خلفية الموقع. اترك الحقول فارغة لاستخدام اسم المتجر ووصفه. شرائح العروض وشريط المميزات تُعدَّل من لوحة الإدارة، صفحة «الإعدادات».</p>
      <label class="mb-4 flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="intro_enabled" value="1" <?= $ic['enabled'] ? 'checked' : '' ?> class="h-4 w-4"> إظهار القسم الافتتاحي</label>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block text-sm font-bold">العنوان الكبير<input name="intro_title" value="<?= e($icRaw['intro_title'] ?? '') ?>" maxlength="60" placeholder="<?= e($storeName) ?>" class="c-input mt-1.5"></label>
        <label class="block text-sm font-bold">الشارة الصغيرة (فارغة = إخفاء)<input name="intro_pill" value="<?= e($ic['pill']) ?>" maxlength="40" class="c-input mt-1.5"></label>
        <label class="block text-sm font-bold sm:col-span-2">الوصف المختصر<textarea name="intro_tagline" rows="2" maxlength="160" class="c-input mt-1.5 resize-none"><?= e($icRaw['intro_tagline'] ?? '') ?></textarea></label>
      </div>
      <div class="mt-5 text-sm font-bold">شعار الخلفية (PNG / JPG / WebP، الشفافية مدعومة)
        <div class="mt-2 flex flex-wrap items-center gap-3"><div class="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"><img id="intro-logo-preview" src="<?=$ic['logo']!==''?e(img_url($ic['logo'])):''?>" alt="" class="h-full w-full object-contain <?=$ic['logo']!==''?'':'hidden'?>"><span id="intro-no-logo" class="text-[10px] text-neutral-400 <?=$ic['logo']!==''?'hidden':''?>">لا شعار</span></div><input id="intro-logo-file" type="file" accept="image/png,image/jpeg,image/webp" class="hidden"><button id="intro-logo-upload" type="button" class="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-bold hover:bg-neutral-100"><?=icon('upload',16)?> رفع شعار</button><button id="intro-logo-delete" type="button" class="text-sm font-bold text-red-600 <?=$ic['logo']!==''?'':'hidden'?>">حذف</button></div><p id="intro-logo-message" role="status" class="mt-2 text-xs font-bold"></p>
        <label class="mt-3 block text-xs font-bold">شفافية الشعار: <span id="introOpVal"><?= (int)$ic['opacity'] ?></span>%
          <input type="range" name="intro_logo_opacity" min="0" max="60" value="<?= (int)$ic['opacity'] ?>" class="w-full" oninput="document.getElementById('introOpVal').textContent=this.value"></label>
      </div>
      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <label class="block text-sm font-bold">نص الزر (فارغ = إخفاء)<input name="intro_cta_text" value="<?= e($icRaw['intro_cta_text'] ?? '') ?>" maxlength="30" class="c-input mt-1.5"></label>
        <label class="block text-sm font-bold">رابط الزر<input name="intro_cta_link" value="<?= e($icRaw['intro_cta_link'] ?? '/products.php') ?>" class="c-input mt-1.5" dir="ltr" style="text-align:left"></label>
      </div>
    </div>
    <div class="flex">
      <button class="rounded-full bg-neutral-900 px-10 py-3.5 font-bold text-white shadow-lg transition hover:bg-neutral-700">حفظ الإعدادات</button>
    </div>
  </form>
  <form method="post" class="mt-4 flex justify-center">
    <input type="hidden" name="tg_test" value="1">
    <button class="rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-sm font-bold text-neutral-600 transition hover:bg-neutral-100">إرسال رسالة تجريبية عبر تيليجرام</button>
  </form>
</main>

<script>(()=>{const file=document.getElementById('intro-logo-file'),up=document.getElementById('intro-logo-upload'),del=document.getElementById('intro-logo-delete'),msg=document.getElementById('intro-logo-message'),image=document.getElementById('intro-logo-preview'),empty=document.getElementById('intro-no-logo');up.onclick=()=>file.click();async function save(remove){const fd=new FormData();fd.append('csrf',<?=json_encode($_SESSION['auth_csrf'])?>);fd.append('form_csrf',<?=json_encode($_SESSION['form_csrf'])?>);if(remove)fd.append('action','delete');else if(file.files[0])fd.append('file',file.files[0]);else return;up.disabled=del.disabled=true;msg.textContent='جاري الحفظ…';try{const r=await fetch('intro-logo.php',{method:'POST',body:fd}),d=await r.json();if(!r.ok)throw Error(d.error||'فشل الحفظ');image.src=d.path||'';image.classList.toggle('hidden',remove);empty.classList.toggle('hidden',!remove);del.classList.toggle('hidden',remove);msg.textContent=remove?'تم حذف الشعار':'تم رفع الشعار وتجهيزه (يظهر في المتجر فوراً)';}catch(e){msg.textContent=e.message||'تعذر الاتصال بالخادم';}finally{up.disabled=del.disabled=false;file.value='';}}file.onchange=()=>save(false);del.onclick=()=>save(true);})();</script>

</body>
</html>
