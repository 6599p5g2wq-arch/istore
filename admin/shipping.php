<?php
require_once __DIR__ . '/_init.php';
require_admin();
function shipping_finish():void {if(($_SERVER['HTTP_ACCEPT']??'')==='application/json'){ $error=$_SESSION['admin_error']??'';unset($_SESSION['admin_error'],$_SESSION['admin_flash']);json_response($error?['ok'=>false,'error'=>$error]:['ok'=>true],$error?400:200);}redirect_admin('shipping.php');}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $id = (int)($_POST['id'] ?? 0);
    if ($action === 'save') {
        $name = mb_substr(trim($_POST['name'] ?? ''), 0, 120);
        $fee = max(0, (float)($_POST['fee'] ?? 0));
        $sort = (int)($_POST['sort_order'] ?? 0);
        $active = !empty($_POST['active']) ? 1 : 0;
        if (!$name) { flash('اسم المدينة مطلوب', true); shipping_finish(); }
        $dup = qone('SELECT id FROM cities WHERE name=? AND id<>?', [$name,$id]);
        if ($dup) { flash('المدينة موجودة من قبل', true); shipping_finish(); }
        if ($id && !$active && qone('SELECT active FROM cities WHERE id=?',[$id])['active'] && (int)qone('SELECT COUNT(*) n FROM cities WHERE active=1')['n']<=1) { flash('لا يمكن تعطيل آخر مدينة متاحة',true); shipping_finish(); }
        if ($id) { q('UPDATE cities SET name=?, fee=?, sort_order=?, active=? WHERE id=?', [$name, $fee, $sort, $active, $id]); flash('تم حفظ المدينة'); }
        else {
            $dup = qone('SELECT id FROM cities WHERE name = ?', [$name]);
            if ($dup) { flash('المدينة موجودة من قبل', true); shipping_finish(); }
            q('INSERT INTO cities (name, fee, sort_order, active) VALUES (?, ?, ?, ?)', [$name, $fee, $sort, $active]);
            flash('تمت إضافة المدينة');
        }
    } elseif ($action === 'move' && $id) {
        $ids=array_column(qall('SELECT id FROM cities ORDER BY sort_order,name,id'),'id');
        $i=array_search($id,array_map('intval',$ids)); $j=$i+(($_POST['dir']??'')==='up'?-1:1);
        if($i!==false && isset($ids[$j])) { db()->beginTransaction(); try { [$ids[$i],$ids[$j]]=[$ids[$j],$ids[$i]]; foreach($ids as $n=>$cid) q('UPDATE cities SET sort_order=? WHERE id=?',[$n+1,$cid]); db()->commit(); } catch(Throwable $e) { db()->rollBack(); flash('تعذر تغيير الترتيب',true); shipping_finish(); } }
    } elseif ($action === 'toggle' && $id) {
        if (qone('SELECT active FROM cities WHERE id=?',[$id])['active'] && (int)qone('SELECT COUNT(*) n FROM cities WHERE active=1')['n']<=1) { flash('لا يمكن تعطيل آخر مدينة متاحة',true); shipping_finish(); }
        q('UPDATE cities SET active = 1 - active WHERE id = ?', [$id]);
    } elseif ($action === 'delete' && $id) {
        if (qone('SELECT active FROM cities WHERE id=?',[$id])['active'] && (int)qone('SELECT COUNT(*) n FROM cities WHERE active=1')['n']<=1) { flash('لا يمكن حذف آخر مدينة متاحة',true); shipping_finish(); }
        q('DELETE FROM cities WHERE id = ?', [$id]);
        flash('تم حذف المدينة');
    } elseif ($action === 'threshold') {
        set_setting('free_shipping_threshold', (string)max(0, (float)($_POST['free_shipping_threshold'] ?? 0)));
        flash('تم حفظ حد الشحن المجاني');
    }
    shipping_finish();
}
$edit = isset($_GET['edit']) ? qone('SELECT * FROM cities WHERE id = ?', [(int)$_GET['edit']]) : null;
$cities = qall('SELECT * FROM cities ORDER BY sort_order, name');
admin_header('التوصيل والمدن', 'shipping.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">التوصيل والمدن</h1>
<p class="mt-1 text-sm text-neutral-500">إدارة المدن والرسوم والترتيب وحد الشحن المجاني</p><?php admin_msg(); ?>
<div class="mt-6 space-y-5">
<form method="post" class="flex flex-wrap items-end gap-3 rounded-3xl bg-white p-5"><input type="hidden" name="action" value="threshold"><label class="text-sm font-bold">الشحن المجاني للطلبات من (<?=e(setting('currency','د.ل'))?>)<input aria-label="حد الشحن المجاني" name="free_shipping_threshold" type="number" min="0" step="0.01" required value="<?=e(setting('free_shipping_threshold','0'))?>" class="city-input mt-2 block max-w-52"></label><button class="rounded-full bg-black px-5 py-2 text-sm font-bold text-white">حفظ الحد</button><p class="text-xs text-neutral-500">0 لتعطيل الشحن المجاني</p></form>
<p id="city-message" hidden role="status" class="rounded-2xl p-4 text-sm"></p>
<div class="grid grid-cols-1 gap-6 lg:grid-cols-3"><div class="min-w-0 space-y-3 lg:col-span-2">
<?php foreach($cities as $ci=>$c): ?>
<div data-city="<?=(int)$c['id']?>" data-sort="<?=(int)$c['sort_order']?>" class="rounded-3xl bg-white p-4 shadow-sm"><div class="flex items-center gap-2"><div class="flex shrink-0 flex-col">
<?php foreach(['up'=>'أعلى','down'=>'أسفل'] as $dir=>$label): ?><button type="button" data-move="<?=$dir?>" aria-label="<?=$label?>" <?=($dir==='up'?$ci===0:$ci===count($cities)-1)?'disabled':''?> class="rounded-lg p-1 hover:bg-neutral-100 disabled:opacity-25"><?=icon('chevron-'.$dir,17)?></button><?php endforeach; ?></div>
<input aria-label="اسم المدينة" data-name value="<?=e($c['name'])?>" class="city-input font-bold"><button type="button" data-delete aria-label="حذف" class="shrink-0 rounded-full bg-red-50 p-2 text-red-500"><?=icon('trash',16)?></button></div>
<div class="mt-3 flex flex-wrap items-center gap-3 pr-8"><label class="text-xs font-bold">الرسوم (<?=e(setting('currency','د.ل'))?>)<input aria-label="رسوم التوصيل" data-fee type="number" min="0" step="0.01" value="<?=(float)$c['fee']?>" class="city-input mt-1 block !w-28"></label><?php if((float)$c['fee']===0.0): ?><span class="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">مجاني</span><?php endif; ?><label class="mr-auto flex items-center gap-2 text-xs font-bold"><input data-active type="checkbox" <?=$c['active']?'checked':''?> class="h-5 w-5 accent-black"><?=$c['active']?'متاحة':'غير متاحة'?></label></div></div>
<?php endforeach; ?>
<?php if(!$cities): ?><div class="rounded-3xl border-2 border-dashed bg-white p-10 text-center"><?=icon('map-pin',24)?><p class="mt-3 font-bold">لا توجد مدن بعد</p><p class="mt-2 text-sm text-neutral-500">أضف مدينة متاحة لتمكين إتمام الطلبات</p></div><?php endif; ?>
<p class="text-xs text-neutral-500">يُحفظ الاسم والرسوم عند مغادرة الحقل. لا يمكن حذف أو تعطيل آخر مدينة متاحة.</p></div>
<form method="post" class="h-fit space-y-4 rounded-3xl bg-white p-6 lg:sticky lg:top-8"><h2 class="font-extrabold">إضافة مدينة</h2><input type="hidden" name="action" value="save"><input type="hidden" name="active" value="1"><label class="block text-sm font-bold">اسم المدينة *<input name="name" required class="city-input mt-2"></label><label class="block text-sm font-bold">رسوم التوصيل<input name="fee" type="number" min="0" step="0.01" placeholder="0" class="city-input mt-2"></label><button class="flex w-full items-center justify-center gap-2 rounded-full bg-black py-3 font-bold text-white"><?=icon('plus',16)?> إضافة</button></form></div></div>
<style>.city-input{width:100%;min-width:0;border-radius:12px;border:1px solid #e5e5e5;padding:8px 12px;font-size:14px;outline:none}.city-input:focus{border-color:#000}</style>
<script>(()=>{const token=<?=json_encode($_SESSION['form_csrf'])?>,message=document.getElementById('city-message');async function request(body){body.form_csrf=token;message.hidden=true;try{const r=await fetch('shipping.php',{method:'POST',headers:{Accept:'application/json'},body:new URLSearchParams(body)}),d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'تعذر الحفظ');location.reload();}catch(e){message.textContent=e.message||'تعذر الاتصال. لم يتم تأكيد الحفظ';message.className='rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700';message.hidden=false;}}document.querySelectorAll('[data-city]').forEach(row=>{const name=row.querySelector('[data-name]'),fee=row.querySelector('[data-fee]'),active=row.querySelector('[data-active]');let oldName=name.value,oldFee=fee.value;const save=()=>request({action:'save',id:row.dataset.city,name:name.value,fee:fee.value,active:active.checked?'1':'',sort_order:row.dataset.sort});name.onblur=()=>{if(name.value!==oldName)save()};fee.onblur=()=>{if(fee.value!==oldFee)save()};active.onchange=save;row.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>request({action:'move',id:row.dataset.city,dir:b.dataset.move}));row.querySelector('[data-delete]').onclick=()=>{if(confirm('حذف مدينة '+name.value+'؟'))request({action:'delete',id:row.dataset.city})};});})();</script>
<?php admin_footer(); ?>
