<?php
require_once __DIR__ . '/_init.php';
$me=require_admin();$err='';$field='';$username='';$targetId=0;$action='';
if($_SERVER['REQUEST_METHOD']==='POST'){
 $action=$_POST['action']??'';$targetId=(int)($_POST['id']??0);$password=(string)($_POST['password']??'');$confirmation=(string)($_POST['confirm_password']??'');
 if($action==='add'){
  $username=trim((string)($_POST['username']??''));
  if(!$username||mb_strlen($username)>100){$err='اسم المستخدم مطلوب، بحد أقصى 100 حرف';$field='username';}
  elseif(qone('SELECT id FROM admin_users WHERE username=?',[$username])){$err='اسم المستخدم موجود مسبقاً';$field='username';}
  elseif(mb_strlen($password)<6){$err='كلمة المرور 6 أحرف على الأقل';$field='password';}
  elseif($password!==$confirmation){$err='كلمتا المرور غير متطابقتين';$field='confirm_password';}
  else{q('INSERT INTO admin_users (username,pass_hash) VALUES (?,?)',[$username,password_hash($password,PASSWORD_DEFAULT)]);flash('تمت إضافة المشرف '.$username);redirect_admin('admins.php');}
 }elseif(in_array($action,['password','delete'],true)){
  $target=qone('SELECT id,username FROM admin_users WHERE id=?',[$targetId]);
  if(!$target){$err='المشرف غير موجود';}
  elseif($action==='password'){
   if(mb_strlen($password)<6){$err='كلمة المرور 6 أحرف على الأقل';$field='password';}
   elseif($password!==$confirmation){$err='كلمتا المرور غير متطابقتين';$field='confirm_password';}
   else{q('UPDATE admin_users SET pass_hash=? WHERE id=?',[password_hash($password,PASSWORD_DEFAULT),$targetId]);q('DELETE FROM sessions WHERE admin_id=?',[$targetId]);auth_revoke_principal('admin',(string)$targetId);
    if($targetId===(int)$me['id']){admin_logout();admin_header('تسجيل الدخول مجدداً','admins.php');echo '<div role="status" class="admin-card p-6"><h1 class="text-xl font-bold">تم تغيير كلمة مرورك وإنهاء كل جلساتك</h1><p class="mt-3">سجّل الدخول بكلمة المرور الجديدة للمتابعة.</p><a class="admin-btn mt-4" href="'.e(admin_url('login.php')).'">تسجيل الدخول مجدداً</a></div>';admin_footer();exit;}
    $_SESSION['admin_row_success']=['id'=>$targetId,'message'=>'تم تغيير كلمة مرور '.$target['username'].' وإنهاء جلساته'];redirect_admin('admins.php');}
  }else{
   if($targetId===(int)$me['id'])$err='لا يمكنك حذف حسابك الحالي';
   elseif((int)qone('SELECT COUNT(*) c FROM admin_users')['c']<=1)$err='يجب أن يبقى مشرف واحد على الأقل';
   else{q('DELETE FROM sessions WHERE admin_id=?',[$targetId]);auth_revoke_principal('admin',(string)$targetId);q('DELETE FROM admin_users WHERE id=?',[$targetId]);flash('تم حذف المشرف '.$target['username']);redirect_admin('admins.php');}
  }
 }else{$err='عملية غير صالحة';}
 if($err)http_response_code(422);
}
$rowSuccess=$_SESSION['admin_row_success']??null;unset($_SESSION['admin_row_success']);
$admins=qall('SELECT id,username,created_at FROM admin_users ORDER BY id');
function admin_field_error($f,$forId=0){global $err,$field,$targetId,$action;if($err&&$field===$f&&(($forId===0&&$action==='add')||($forId===$targetId&&$action==='password')))echo '<p role="alert" class="mt-2 text-xs font-bold text-red-700">'.e($err).'</p>';}
function admin_field_bad($f,$forId=0){global $err,$field,$targetId,$action;return $err&&$field===$f&&(($forId===0&&$action==='add')||($forId===$targetId&&$action==='password'))?'aria-invalid="true" style="border-color:#dc2626;background:#fef2f2"':'';}
function password_fields($id=0){ ?>
<label class="block text-sm font-bold"><?= $id?'كلمة مرور جديدة':'كلمة المرور' ?><input aria-label="<?= $id?'كلمة مرور جديدة':'كلمة المرور' ?>" type="password" name="password" autocomplete="new-password" required minlength="6" maxlength="128" dir="ltr" class="admin-input mt-2" <?= admin_field_bad('password',$id) ?>></label><?php admin_field_error('password',$id); ?>
<p data-strength class="text-xs text-neutral-500">6 أحرف على الأقل</p>
<label class="block text-sm font-bold">تأكيد كلمة المرور<input aria-label="تأكيد كلمة المرور" type="password" name="confirm_password" autocomplete="new-password" required minlength="6" maxlength="128" dir="ltr" class="admin-input mt-2" <?= admin_field_bad('confirm_password',$id) ?>></label><?php admin_field_error('confirm_password',$id); ?>
<label class="flex items-center gap-2 text-xs"><input type="checkbox" data-show>إظهار كلمات المرور</label>
<?php }
admin_header('المشرفون','admins.php'); ?>
<h1 class="text-2xl font-black sm:text-3xl">المشرفون</h1><p class="mt-1 text-sm text-neutral-500">حسابات الدخول للوحة التحكم — غيّر كلمة المرور الافتراضية فوراً</p>
<div class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">كل المشرفين لديهم وصول كامل لإدارة المتجر. حسابات /control منفصلة. أضف الأشخاص الموثوقين فقط.<p class="mt-2 font-bold">عدد المشرفين: <?= count($admins) ?></p></div>
<div class="mt-4"><?php admin_msg();if($err&&!$field)echo '<p role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">'.e($err).'</p>'; ?></div>
<div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
 <form method="post" class="order-2 admin-card h-fit space-y-4 p-6 lg:sticky lg:top-8"><h2 class="font-extrabold">مشرف جديد</h2><input type="hidden" name="action" value="add">
 <label class="block text-sm font-bold">اسم المستخدم<input aria-label="اسم المستخدم" name="username" dir="ltr" value="<?= e($username) ?>" required maxlength="100" class="admin-input mt-2" <?= admin_field_bad('username') ?>></label><?php admin_field_error('username');password_fields(); ?>
 <button class="admin-btn w-full justify-center">إضافة مشرف</button><p data-result role="status" class="text-xs text-red-700"></p></form>
 <div class="order-1 space-y-4 lg:col-span-2"><?php foreach($admins as $a):$id=(int)$a['id'];$self=$id===(int)$me['id']; ?>
 <article class="admin-card min-w-0 p-5"><div class="flex flex-wrap items-center justify-between gap-3"><div class="min-w-0"><p class="break-all font-extrabold"><bdi><?= e($a['username']) ?></bdi> <?php if($self):?><span class="rounded-full bg-violet-100 px-2 py-1 text-xs text-violet-700">أنت</span><?php endif; ?></p><p class="mt-2 text-xs text-neutral-500">أنشئ <?= e(admin_ar_ly_date($a['created_at'])) ?></p></div>
 <div class="flex flex-wrap gap-2"><button type="button" data-pw-toggle class="rounded-full border px-4 py-2 text-xs font-bold"><?= $err&&$action==='password'&&$targetId===$id?'إلغاء':'تغيير كلمة المرور' ?></button><form method="post" data-confirm="<?= e('حذف حساب «'.$a['username'].'» نهائياً وإنهاء جلساته؟') ?>"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= $id ?>"><button <?= $self||count($admins)<=1?'disabled':'' ?> class="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-700 disabled:opacity-40">حذف المشرف</button><p data-result class="text-xs text-red-700"></p></form></div></div>
 <?php if($rowSuccess&&$rowSuccess['id']===$id): ?><p role="status" class="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"><?= e($rowSuccess['message']) ?></p><?php endif; ?>
 <?php if($self||count($admins)<=1): ?><p class="mt-3 text-xs text-neutral-500"><?= $self?'لا يمكنك حذف حسابك الحالي.':'يجب أن يبقى مشرف واحد على الأقل.' ?></p><?php endif; ?>
 <form method="post" data-confirm="<?= e('تغيير كلمة مرور «'.$a['username'].'»؟ سيتم إنهاء كل جلساته'.($self?' وتحتاج لتسجيل الدخول مجدداً':'').'.') ?>" class="mt-4 space-y-3 rounded-2xl bg-neutral-50 p-4 <?= $err&&$action==='password'&&$targetId===$id?'':'hidden' ?>" data-pw-form><input type="hidden" name="action" value="password"><input type="hidden" name="id" value="<?= $id ?>"><?php password_fields($id); ?><p class="text-xs text-neutral-500">سيتم إنهاء كل جلسات هذا المشرف بعد الحفظ.</p><button class="admin-btn">حفظ كلمة المرور</button><p data-result role="status" class="text-xs text-red-700"></p></form><div class="mt-3"></div></article>
 <?php endforeach; ?></div>
</div>

<script>
document.querySelectorAll('[data-pw-toggle]').forEach(b=>b.addEventListener('click',()=>{const f=b.closest('article').querySelector('[data-pw-form]');const h=f.classList.toggle('hidden');b.textContent=h?'تغيير كلمة المرور':'إلغاء';}));
document.querySelectorAll('form').forEach(form=>{
 const pw=form.querySelector('[name=password]'),cp=form.querySelector('[name=confirm_password]');
 form.querySelector('[data-show]')?.addEventListener('change',e=>{[pw,cp].forEach(x=>x.type=e.target.checked?'text':'password');});
 pw?.addEventListener('input',()=>{form.querySelector('[data-strength]').textContent=pw.value.length<6?'6 أحرف على الأقل':pw.value.length>=12&&/[0-9]/.test(pw.value)&&/[^a-zA-Z0-9]/.test(pw.value)?'قوية':'يمكن تقويتها: استخدم 12 حرفاً مع أرقام ورموز';});
 form.addEventListener('submit',e=>{const result=form.querySelector('[data-result]');if(pw&&pw.value!==cp.value){e.preventDefault();result.textContent='كلمتا المرور غير متطابقتين';cp.focus();return;}if(form.dataset.confirm&&!confirm(form.dataset.confirm)){e.preventDefault();return;}let btn=e.submitter||form.querySelector('button');btn.disabled=true;btn.textContent='جارٍ التنفيذ...';});
});
</script>
<?php admin_footer(); ?>
