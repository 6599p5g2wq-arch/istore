<?php
require_once __DIR__ . '/_init.php';
require_once APP_ROOT . '/includes/announcement.php';
require_admin();

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
    $currency = trim(mb_substr((string)($_POST['currency'] ?? ''), 0, 12));
    if ($s !== null && $e !== null && $s >= $e) {
        flash('تاريخ البداية يجب أن يسبق تاريخ الانتهاء', true);
    } elseif ($currency === '') {
        flash('رمز العملة مطلوب', true);
    } else {
        set_setting('currency', $currency);
        set_setting('announce_config', json_encode($cfg, JSON_UNESCAPED_UNICODE));
        // للتوافق مع القراءة القديمة (التطبيق/الـ API): أول رسالة فعّالة
        set_setting('announcement', announce_active($cfg) ? $cfg['messages'][0]['text'] : '');
        flash('تم حفظ الإعدادات');
    }
    redirect_admin('settings.php');
}

$c = announce_read();
if (!$c['messages']) $c['messages'] = [['text' => '', 'link' => '']];
admin_header('الإعدادات', 'settings.php');
?>
<div class="max-w-3xl">
  <h1 class="text-2xl font-black sm:text-3xl">الإعدادات</h1>
  <p class="mt-1 text-sm text-neutral-500">شريط الإعلانات والعملة</p>
  <?php admin_msg(); ?>
  <form method="post" class="mt-6 space-y-5">
    <div class="admin-card p-6">
      <h2 class="font-extrabold">العملة</h2>
      <p class="mt-1 text-xs text-neutral-500">تظهر بجانب كل الأسعار في المتجر.</p>
      <label class="mt-3 block text-sm font-bold">رمز العملة
        <input name="currency" required maxlength="12" value="<?= e(setting('currency', 'د.ل')) ?>" class="admin-input mt-1 max-w-xs">
      </label>
    </div>

    <div class="admin-card p-6">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="font-extrabold">شريط الإعلانات</h2>
          <p class="mt-1 text-xs text-neutral-500">يظهر أعلى كل صفحات المتجر. عند وجود أكثر من رسالة تتبدل تلقائياً.</p>
        </div>
        <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="enabled" value="1" <?= $c['enabled'] ? 'checked' : '' ?> class="h-4 w-4"> مفعّل</label>
      </div>

      <div id="msgs" class="mt-4 space-y-3">
        <?php foreach ($c['messages'] as $m): ?>
        <div class="msg rounded-2xl bg-neutral-50 p-3">
          <div class="flex gap-2">
            <input name="msg_text[]" maxlength="200" value="<?= e($m['text']) ?>" placeholder="نص الرسالة" class="admin-input">
            <button type="button" class="rm admin-btn-ghost admin-btn-danger" title="حذف">🗑</button>
          </div>
          <input name="msg_link[]" maxlength="500" value="<?= e($m['link']) ?>" placeholder="رابط عند الضغط (اختياري): /products أو https://..." dir="ltr" class="admin-input mt-2">
        </div>
        <?php endforeach; ?>
      </div>
      <button type="button" id="add" class="admin-btn-ghost mt-3">+ إضافة رسالة</button>

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
    <button class="admin-btn">حفظ الإعدادات</button>
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
    n.querySelectorAll('input').forEach(function(i){ i.value = ''; });
    box.appendChild(n); bind(n);
  };
})();
</script>
<?php admin_footer(); ?>
