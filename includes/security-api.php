<?php
require_once __DIR__.'/bootstrap.php';require_once __DIR__.'/auth.php';header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
$panel=($_GET['panel']??'')==='control'?'control':'admin';$u=$panel==='control'?control_user():admin_user();
function auth_json(array $data,int $status=200):void{http_response_code($status);echo json_encode($data,JSON_UNESCAPED_UNICODE);exit;}
if(!$u)auth_json(['error'=>'غير مصرح'],401);$id=(string)$u['id'];
if($_SERVER['REQUEST_METHOD']==='GET'){auth_json(['enabled'=>auth_totp_enabled($panel,$id),'ready'=>auth_totp_ready(),'config'=>auth_config(),'csrf'=>$_SESSION['auth_csrf']??($_SESSION['auth_csrf']=bin2hex(random_bytes(24))),'activity'=>$panel==='control'?qall('SELECT id,panel,username,device,result,created_at FROM auth_activity ORDER BY id DESC LIMIT 100'):[]]);}
$b=json_decode(file_get_contents('php://input'),true)?:[];if(!hash_equals($_SESSION['auth_csrf']??'',(string)($b['csrf']??'')))auth_json(['error'=>'انتهت صلاحية النموذج'],403);
if(($b['action']??'')==='heartbeat')auth_json(['ok'=>true,'idleMinutes'=>auth_config()['idleMinutes']]);
$ip=$_SERVER['REMOTE_ADDR']??'local';if(auth_locked($panel,$u['username'],$ip))auth_json(['error'=>'محاولات كثيرة، حاول لاحقا'],429);
$table=$panel==='control'?'control_users':'admin_users';$row=qone("SELECT pass_hash FROM $table WHERE id=?",[$id]);if(!password_verify((string)($b['password']??''),$row['pass_hash'])){auth_failure($panel,$u['username'],$ip);auth_json(['error'=>'كلمة المرور الحالية غير صحيحة'],401);}
try{
 if(($b['action']??'')==='config'&&$panel==='control'){$fields=[['auth_failure_limit','failures',3,20],['auth_lock_minutes','lockMinutes',1,120],['auth_idle_minutes','idleMinutes',5,240],['auth_remember_days','rememberDays',1,30]];foreach($fields as [$key,$name,$lo,$hi]){if(!isset($b[$name])||filter_var($b[$name],FILTER_VALIDATE_INT)===false||$b[$name]<$lo||$b[$name]>$hi)auth_json(['error'=>'قيمة الأمان خارج النطاق المسموح'],400);}foreach($fields as [$key,$name])set_setting($key,(string)$b[$name]);auth_log($panel,$u['username'],$_SERVER['HTTP_USER_AGENT']??'','policy_changed');auth_json(['ok'=>true]);}
 if(!auth_totp_ready())auth_json(['error'=>'لم يتم إعداد مفتاح تشفير الخادم بعد'],503);
 if(($b['action']??'')==='begin')auth_json(auth_totp_begin($panel,$id,$u['username']));
 if(($b['action']??'')==='confirm'){$codes=auth_totp_confirm($panel,$id,(string)($b['code']??''));if(!$codes){auth_failure($panel,$u['username'],$ip);auth_json(['error'=>'رمز التحقق غير صحيح'],400);}auth_success($panel,$u['username'],$ip);auth_log($panel,$u['username'],$_SERVER['HTTP_USER_AGENT']??'','totp_enabled');auth_json(['ok'=>true,'recovery_codes'=>$codes,'relogin'=>true]);}
 if(($b['action']??'')==='disable'){if(!auth_totp_disable($panel,$id,(string)($b['code']??''))){auth_failure($panel,$u['username'],$ip);auth_json(['error'=>'رمز التحقق غير صحيح'],400);}auth_log($panel,$u['username'],$_SERVER['HTTP_USER_AGENT']??'','totp_disabled');auth_json(['ok'=>true,'relogin'=>true]);}auth_json(['error'=>'إجراء غير معروف'],400);
}catch(Throwable $e){auth_json(['error'=>'تعذر تحديث التحقق بخطوتين، تحقق من إعداد الخادم'],400);}
