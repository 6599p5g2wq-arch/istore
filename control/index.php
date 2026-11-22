<?php
require_once dirname(__DIR__) . '/includes/bootstrap.php';
require_once APP_ROOT . '/includes/auth.php';
require_control();

$SECTIONS = [
    ['title' => 'هوية المتجر', 'fields' => [
        ['store_name', 'اسم المتجر'], ['store_tagline', 'الوصف المختصر', true], ['announcement', 'شريط الإعلانات (أعلى الصفحة)'],
        ['currency', 'العملة'], ['footer_text', 'نص الحقوق أسفل الصفحة'],
    ]],
    ['title' => 'التواصل', 'fields' => [
        ['phone', 'رقم الهاتف', false, true], ['whatsapp', 'رقم واتساب (بالصيغة الدولية بدون +)', false, true],
        ['email', 'البريد الإلكتروني', false, true], ['address', 'العنوان'], ['working_hours', 'أوقات العمل'],
    ]],
    ['title' => 'وسائل التواصل الاجتماعي', 'fields' => [
        ['facebook', 'فيسبوك', false, true], ['instagram', 'انستغرام', false, true], ['tiktok', 'تيك توك', false, true],
    ]],
    ['title' => 'الشحن', 'fields' => [
        ['free_shipping_threshold', 'حد الشحن المجاني (0 لتعطيله)', false, true],
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
    ['title' => 'صفحة من نحن', 'fields' => [
        ['about_text', 'نبذة عن المتجر', true], ['delivery_policy', 'سياسة التوصيل', true], ['returns_policy', 'سياسة الاستبدال والاسترجاع', true],
    ]],
];

$saved = false;
$tgTest = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['tg_test'])) {
        $tgTest = tg_send('✅ رسالة تجريبية: إشعارات طلبات ' . setting('store_name', 'آي ستور') . ' تعمل بنجاح.');
    } else {
        foreach ($SECTIONS as $sec) {
            foreach ($sec['fields'] as $f) {
                $key = $f[0];
                if (!array_key_exists($key, $_POST)) continue;
                // التوكن لا يُمسح بقيمة فارغة: يُحدَّث فقط عند كتابة قيمة جديدة
                if ($key === 'telegram_bot_token' && trim((string)$_POST[$key]) === '') continue;
                set_setting($key, trim((string)$_POST[$key]));
            }
        }
        $saved = true;
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
  <?php if ($saved): ?><div class="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">تم حفظ الإعدادات بنجاح ✓</div><?php endif; ?>
  <?php if ($tgTest !== null): ?><div class="mt-5 rounded-2xl p-4 text-sm font-bold <?= $tgTest ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700' ?>"><?= $tgTest ? 'وصلت الرسالة التجريبية إلى تيليجرام ✓' : 'فشل الإرسال — راجع التوكن ومعرف المحادثة' ?></div><?php endif; ?>
  <form method="post" class="mt-8 space-y-6">
    <?php foreach ($SECTIONS as $sec): ?>
      <div class="rounded-3xl bg-white p-6 shadow-sm">
        <h2 class="mb-5 text-lg font-extrabold"><?= e($sec['title']) ?></h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <?php foreach ($sec['fields'] as $f): [$key, $label, $area, $ltr] = $f + [2 => false, 3 => false]; ?>
            <label class="block text-sm font-bold <?= $area ? 'sm:col-span-2' : '' ?>"><?= e($label) ?>
              <?php if ($area): ?>
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
