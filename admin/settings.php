<?php
require_once __DIR__ . '/_init.php';
require_once APP_ROOT . '/includes/announcement.php';
require_once APP_ROOT . '/includes/intro.php';
require_once APP_ROOT . '/includes/marquee.php';
require_admin();
$err=''; $errorField=''; $posted=false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $msgs = [];
    $texts = $_POST['msg_text'] ?? []; $links = $_POST['msg_link'] ?? [];
    if (is_array($texts)) foreach ($texts as $i => $t) $msgs[] = ['text' => (string)$t, 'link' => (string)($links[$i] ?? '')];
    $cfg = announce_sanitize([
        'enabled' => !empty($_POST['enabled']), 'messages' => $msgs, 'interval' => $_POST['interval'] ?? 5,
        'bg' => $_POST['bg'] ?? '', 'color' => $_POST['color'] ?? '',
        'start' => $_POST['start'] ?? '', 'end' => $_POST['end'] ?? '',
        'effect' => $_POST['effect'] ?? 'fade', 'countdown' => !empty($_POST['countdown']), 'closable' => !empty($_POST['closable']),
    ]);
    $s = announce_ms($cfg['start']); $e = announce_ms($cfg['end']);
    $t = function (string $k, int $max = 300): string { return trim(mb_substr((string)($_POST[$k] ?? ''), 0, $max)); };
    $currency = $t('currency', 12);
    $rate = $t('currency2_rate', 20);
    $thr = $t('free_shipping_threshold', 20);
    $pos = ($_POST['currency_pos'] ?? '') === 'before' ? 'before' : 'after';
    $dec = in_array($_POST['currency_decimals'] ?? '', ['0', '2'], true) ? $_POST['currency_decimals'] : 'auto';
    $err = '';
    if ($s !== null && $e !== null && $s >= $e) $err = 'تاريخ بداية الشريط يجب أن يسبق تاريخ نهايته';
    elseif ($currency === '') $err = 'رمز العملة مطلوب';
    elseif ($rate !== '' && !(is_numeric($rate) && (float)$rate > 0)) $err = 'سعر الصرف يجب أن يكون رقماً أكبر من صفر';
    elseif ($thr === '' || !is_numeric($thr) || (float)$thr < 0) $err = 'حد الشحن المجاني يجب أن يكون رقماً (0 لتعطيله)';
    if ($err !== '') {
        $posted=true;
        $errorField = str_contains($err,'بداية') ? 'end' : (str_contains($err,'رمز') ? 'currency' : (str_contains($err,'الصرف') ? 'currency2_rate' : 'free_shipping_threshold'));
        http_response_code(422);
    } else {
        set_setting('currency2_symbol', $t('currency2_symbol', 10));
        set_setting('currency', $currency);
        set_setting('currency_pos', $pos);
        set_setting('currency_decimals', $dec);
        set_setting('currency2_rate', $rate);
        set_setting('free_shipping_threshold', (string)(float)$thr);
        $chips = []; foreach ((array)($_POST['intro_icon'] ?? []) as $i => $ic) $chips[] = ['icon' => (string)$ic, 'text' => (string)($_POST['intro_text'][$i] ?? '')];
        set_setting('intro_chips', json_encode(marquee_clean($chips, INTRO_ICON_LABELS), JSON_UNESCAPED_UNICODE));
        $mqi = []; foreach ((array)($_POST['mq_icon'] ?? []) as $i => $ic) $mqi[] = ['icon' => (string)$ic, 'text' => (string)($_POST['mq_text'][$i] ?? '')];
        set_setting('marquee_enabled', !empty($_POST['marquee_enabled']) ? '1' : '0');
        set_setting('marquee_items', json_encode(marquee_clean($mqi, MARQUEE_ICON_LABELS), JSON_UNESCAPED_UNICODE));
        set_setting('announce_config', json_encode($cfg, JSON_UNESCAPED_UNICODE));
        // للتوافق مع القراءة القديمة (التطبيق/الـ API): أول رسالة فعّالة
        set_setting('announcement', announce_active($cfg) ? $cfg['messages'][0]['text'] : '');
        flash('تم حفظ الإعدادات');
        redirect_admin('settings.php');
    }
}
function settings_value($key,$fallback='') { global $posted; return $posted ? (string)($_POST[$key]??'') : setting($key,$fallback); }

$c = $posted ? $cfg : announce_read();
if($posted) { $c['messages']=$msgs; foreach(['start','end'] as $k) $c[$k]=(string)($_POST[$k]??''); }
if (!$c['messages']) $c['messages'] = [['text' => '', 'link' => '']];
$chipRows = intro_cfg()['chips'];
if($posted) { $chipRows=[];foreach((array)($_POST['intro_text']??[]) as $i=>$text) $chipRows[]=['icon'=>$_POST['intro_icon'][$i]??'star','text'=>$text]; }
if(!$chipRows) $chipRows=[['icon'=>'star','text'=>'']];
$mq = marquee_cfg(); $mqRows = $mq['items'];
if($posted) { $mqRows=[];foreach((array)($_POST['mq_text']??[]) as $i=>$text) $mqRows[]=['icon'=>$_POST['mq_icon'][$i]??'star','text'=>$text]; }
if(!$mqRows) $mqRows=[['icon'=>'star','text'=>'']];
admin_header('الإعدادات', 'settings.php');

?>
<div class="max-w-3xl">
  <h1 class="text-2xl font-black sm:text-3xl">الإعدادات</h1>
  <p class="mt-1 text-sm text-neutral-500">الشحن والعملة والأسعار وشريط الإعلانات وشرائح المقدمة وشريط المميزات</p>
  <?php $secPanel='admin';require APP_ROOT.'/includes/security-settings.php';admin_msg(); ?>
  <nav id="settings-nav" class="mt-4 flex flex-wrap gap-2"><?php foreach(['الإعلانات','العملة','شرائح المقدمة','المميزات','الشحن'] as $i=>$lbl): ?><a class="rounded-full border bg-white px-3 py-2 text-xs font-bold" href="#settings-<?= $i ?>"><?= $lbl ?></a><?php endforeach; ?></nav>
  <?php if($err): ?><p role="alert" class="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700"><?= e($err) ?>، احتفظنا بكل القيم التي أدخلتها.</p><?php endif; ?>
  <form id="site-settings-form" method="post" class="mt-6 space-y-5 pb-28">
    <div class="admin-card p-6">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="font-extrabold">شريط الإعلانات</h2>
          <p class="mt-1 text-xs text-neutral-500">يظهر أعلى كل صفحات المتجر. عند وجود أكثر من رسالة تتبدل تلقائياً.</p>
        </div>
        <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="enabled" value="1" <?= $c['enabled'] ? 'checked' : '' ?> class="panel-switch" aria-label="مفعّل"></label>
      </div>

      <div id="msgs" class="mt-4 space-y-3">
        <?php foreach ($c['messages'] as $m): ?>
        <div class="msg rounded-2xl bg-neutral-50 p-3">
          <div class="flex items-center gap-2">
            <span class="msg-num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-black text-[11px] font-extrabold text-white">1</span>
            <input name="msg_text[]" maxlength="200" value="<?= e($m['text']) ?>" placeholder="نص الرسالة" class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-black">
            <button type="button" class="rm grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30" aria-label="حذف الرسالة"><?= icon('trash', 16) ?></button>
          </div>
          <input name="msg_link[]" maxlength="500" value="<?= e($m['link']) ?>" placeholder="رابط عند الضغط (اختياري): /products أو https://..." dir="ltr" class="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-xs outline-none focus:border-black">
        </div>
        <?php endforeach; ?>
      </div>
      <button type="button" id="add" class="mt-3 flex items-center gap-1.5 rounded-full border border-dashed border-neutral-300 px-4 py-2 text-sm font-bold text-neutral-600 transition hover:bg-neutral-50"><?= icon('plus', 15) ?> إضافة رسالة</button>

      <div class="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <label class="block text-sm font-bold">لون الخلفية <input type="color" name="bg" value="<?= e($c['bg']) ?>" class="mt-1 block h-10 w-20 cursor-pointer rounded-lg border border-neutral-300"></label>
        <label class="block text-sm font-bold">لون النص <input type="color" name="color" value="<?= e($c['color']) ?>" class="mt-1 block h-10 w-20 cursor-pointer rounded-lg border border-neutral-300"></label>
        <label class="block text-sm font-bold">التبديل كل (ثانية) <input type="number" name="interval" min="2" max="30" value="<?= (int)$c['interval'] ?>" class="admin-input mt-1"></label>
        <label class="block text-sm font-bold">طريقة العرض
          <select name="effect" class="admin-input mt-1">
            <?php foreach (announce_effects() as $k => $lbl): ?><option value="<?= e($k) ?>" <?= $c['effect'] === $k ? 'selected' : '' ?>><?= e($lbl) ?></option><?php endforeach; ?>
          </select>
          <span class="mt-1 block text-[11px] font-normal text-neutral-400">في الشريط المتحرك تظهر كل الرسائل متتابعة ولا يُستخدم «التبديل كل».</span>
        </label>
        <?php foreach ([['start', 'يبدأ في (اختياري)'], ['end', 'ينتهي في (اختياري)']] as [$k, $lbl]): ?>
        <div class="adt min-w-0 text-sm font-bold">
          <div class="flex items-center justify-between"><span><?= e($lbl) ?></span><button type="button" class="adt-clear hidden text-xs font-bold text-red-600 hover:underline">مسح</button></div>
          <div class="relative mt-1">
            <input type="datetime-local" name="<?= $k ?>" dir="ltr" value="<?= e($c[$k]) ?>" aria-label="<?= e($lbl) ?>" class="adt-input admin-input block h-12 w-full min-w-0 text-left">
            <span class="adt-ph pointer-events-none absolute inset-y-0 left-3 right-11 hidden items-center text-sm font-normal"></span>
          </div>
          <p class="adt-hint mt-1 text-[11px] font-normal text-neutral-400">الصيغة: يوم/شهر/سنة ووقت</p>
        </div>
        <?php endforeach; ?>
      </div>
      <p class="mt-2 text-xs text-neutral-500">التوقيت بتوقيت ليبيا. يختفي الشريط تلقائياً خارج هذه الفترة.</p>
      <label class="mt-4 flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="countdown" value="1" <?= $c['countdown'] ? 'checked' : '' ?> class="h-4 w-4"> عرض عدّاد تنازلي للزائر حتى تاريخ الانتهاء</label>
      <label class="mt-2 flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="closable" value="1" <?= $c['closable'] ? 'checked' : '' ?> class="h-4 w-4"> السماح للزائر بإغلاق الشريط (زر X)</label>
    </div>
    <div class="admin-card p-6">
      <h2 class="font-extrabold">العملة وعرض الأسعار</h2>
      <p class="mt-1 text-xs text-neutral-500">تنطبق على صفحات المتجر.</p>
      <?php $po = price_opts(); if($posted) { $po['pos']=$_POST['currency_pos']??'after';$po['dec']=$_POST['currency_decimals']??'auto'; } ?>
      <div class="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <label class="block text-sm font-bold">رمز العملة
          <input name="currency" required maxlength="12" value="<?= e(settings_value('currency', 'د.ل')) ?>" class="admin-input mt-1">
        </label>
        <label class="block text-sm font-bold">موضع الرمز
          <select name="currency_pos" class="admin-input mt-1">
            <option value="after" <?= $po['pos'] === 'after' ? 'selected' : '' ?>>بعد السعر (150 د.ل)</option>
            <option value="before" <?= $po['pos'] === 'before' ? 'selected' : '' ?>>قبل السعر (د.ل 150)</option>
          </select>
        </label>
        <label class="block text-sm font-bold">الكسور العشرية
          <select name="currency_decimals" class="admin-input mt-1">
            <option value="auto" <?= $po['dec'] === 'auto' ? 'selected' : '' ?>>تلقائي (بدون كسور للأعداد الصحيحة)</option>
            <option value="0" <?= $po['dec'] === '0' ? 'selected' : '' ?>>بدون كسور دائماً (150)</option>
            <option value="2" <?= $po['dec'] === '2' ? 'selected' : '' ?>>خانتان دائماً (150.00)</option>
          </select>
        </label>
      </div>
      <div class="mt-5 rounded-2xl bg-neutral-50 p-4">
        <p class="text-sm font-bold">عملة ثانية للعرض (اختياري)</p>
        <p class="mt-1 text-xs text-neutral-500">تظهر بجانب السعر كقيمة تقريبية، مثل ≈ 28.85 $. للعرض فقط: الدفع والطلبات تبقى بالعملة الأساسية. اترك الحقلين فارغين لإيقافها.</p>
        <div class="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <label class="block text-sm font-bold">رمز العملة الثانية<input name="currency2_symbol" maxlength="10" placeholder="$" value="<?= e(settings_value('currency2_symbol', '')) ?>" class="admin-input mt-1"></label>
          <label class="block text-sm font-bold">سعر الصرف (كم وحدة من عملتك الأساسية تساوي 1 من الثانية)<input name="currency2_rate" dir="ltr" inputmode="decimal" placeholder="5.2" value="<?= e(settings_value('currency2_rate', '')) ?>" class="admin-input mt-1 text-left"></label>
        </div>
      </div>
    </div>

    <div class="admin-card p-6">
      <h2 class="font-extrabold">شرائح العروض (المقدمة الافتتاحية)</h2>
      <p class="mt-1 text-xs text-neutral-500">الشرائح الصغيرة تحت الوصف في أول شاشة من الصفحة الرئيسية، حتى 6. اترك النص فارغاً لحذف الشريحة. باقي نصوص المقدمة والشعار من /control.</p>
      <div id="intro-rows" class="mt-4 space-y-2">
        <?php foreach ($chipRows as $chip): ?>
        <div class="flex flex-wrap items-center gap-2 rounded-xl bg-neutral-50 p-2">
          <select name="intro_icon[]" class="rounded-xl border border-neutral-200 bg-white px-2 py-2.5 text-sm font-bold"><?php foreach (INTRO_ICON_LABELS as $k => $lb): ?><option value="<?= e($k) ?>" <?= $chip['icon'] === $k ? 'selected' : '' ?>><?= e($lb) ?></option><?php endforeach; ?></select>
          <input name="intro_text[]" value="<?= e($chip['text']) ?>" maxlength="40" placeholder="النص" class="min-w-0 flex-1 basis-32 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-4 focus:ring-black/5">
        </div>
        <?php endforeach; ?>
      </div>
    </div>

    <div class="admin-card p-6">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="font-extrabold">شريط المميزات المتحرك</h2>
          <p class="mt-1 text-xs text-neutral-500">الشريط الذي يمر أفقياً تحت السلايدر. حتى 6 عناصر، كل عنصر أيقونة ونص. اترك النص فارغاً لحذف العنصر.</p>
        </div>
        <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="marquee_enabled" value="1" <?= ($posted ? !empty($_POST['marquee_enabled']) : setting('marquee_enabled','1')!=='0') ? 'checked' : '' ?> class="panel-switch" aria-label="ظاهر"></label>
      </div>
      <div id="mq-rows" class="mt-4 space-y-2">
        <?php foreach ($mqRows as $chip): ?>
        <div class="flex flex-wrap items-center gap-2 rounded-xl bg-neutral-50 p-2">
          <select name="mq_icon[]" class="rounded-xl border border-neutral-200 bg-white px-2 py-2.5 text-sm font-bold"><?php foreach (MARQUEE_ICON_LABELS as $k => $lb): ?><option value="<?= e($k) ?>" <?= $chip['icon'] === $k ? 'selected' : '' ?>><?= e($lb) ?></option><?php endforeach; ?></select>
          <input name="mq_text[]" value="<?= e($chip['text']) ?>" maxlength="40" placeholder="النص" class="min-w-0 flex-1 basis-32 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-4 focus:ring-black/5">
        </div>
        <?php endforeach; ?>
      </div>
    </div>

    <div class="admin-card p-6">
      <h2 class="font-extrabold">الشحن</h2>
      <p class="mt-1 text-xs text-neutral-500">الطلبات التي يتجاوز مجموعها هذا الحد يصير توصيلها مجاناً.</p>
      <label class="mt-4 block max-w-xs text-sm font-bold">حد الشحن المجاني (<?= e(settings_value('currency', 'د.ل')) ?>) — 0 لتعطيله
        <input name="free_shipping_threshold" dir="ltr" inputmode="decimal" value="<?= e(settings_value('free_shipping_threshold', '0')) ?>" class="admin-input mt-1 text-left">
      </label>
    </div>

    <div class="fixed bottom-3 left-4 right-4 lg:right-72 z-20 flex flex-wrap items-center justify-start gap-3 rounded-2xl border bg-white p-3 shadow-lg"><span id="save-state" class="text-xs font-bold">كل التعديلات محفوظة</span><button class="flex items-center gap-2 rounded-full bg-black px-10 py-4 font-bold text-white shadow-lg transition hover:bg-neutral-800"><?=icon('save',16)?> حفظ الإعدادات</button></div>
  </form>
</div>
<style>
.adt-input{-webkit-appearance:none;appearance:none;min-height:3rem}
@supports (-webkit-touch-callout:none){.adt-input{color:transparent}.adt-input:focus{color:inherit}.adt-ph{display:flex!important}.adt-input::-webkit-datetime-edit{opacity:0}.adt-input:focus::-webkit-datetime-edit{opacity:1}}
</style>
<script>
(function(){
  document.querySelectorAll('.adt').forEach(function(box){
    var inp = box.querySelector('.adt-input'), ph = box.querySelector('.adt-ph'), clr = box.querySelector('.adt-clear'), hint = box.querySelector('.adt-hint');
    function fmt(v){
      var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v); if (!m) return '';
      var h = +m[4]; return m[3]+'/'+m[2]+'/'+m[1]+'  '+('0'+(h%12||12)).slice(-2)+':'+m[5]+' '+(h<12?'ص':'م');
    }
    function sync(){
      var v = inp.value;
      ph.textContent = v ? fmt(v) : 'اضغط لاختيار التاريخ والوقت';
      ph.className = ph.className.replace(/ (font-bold text-neutral-900|text-neutral-400)/g,'') + (v ? ' font-bold text-neutral-900' : ' text-neutral-400');
      clr.classList.toggle('hidden', !v); hint.style.visibility = v ? 'hidden' : 'visible';
    }
    inp.addEventListener('input', sync); inp.addEventListener('change', sync);
    clr.onclick = function(){ inp.value = ''; sync(); };
    sync();
  });
})();
</script>
<script>
(function(){
  var box = document.getElementById('msgs');
  function bind(row){ row.querySelector('.rm').onclick = function(){ if (box.children.length > 1) row.remove(); else row.querySelectorAll('input').forEach(function(i){ i.value = ''; }); }; }
  Array.prototype.forEach.call(box.children, bind);
  document.getElementById('add').onclick = function(){
    if (box.children.length >= 10) return;
    var n = box.children[0].cloneNode(true);
    n.querySelector('.settings-row-controls')?.remove(); delete n.dataset.enhanced;
    n.querySelectorAll('input').forEach(function(i){ i.value = ''; });
    box.appendChild(n); bind(n);
  };
})();
</script>
<?php if($err): ?><script type="application/json" id="settings-error"><?= json_encode(['field'=>$errorField,'message'=>$err],JSON_HEX_TAG|JSON_HEX_AMP) ?></script><?php endif; ?>
<script src="<?= e(url('assets/settings-admin.js')) ?>" defer></script>
<?php admin_footer(); ?>
