<?php
require_once dirname(__DIR__).'/includes/bootstrap.php';require_once APP_ROOT.'/includes/auth.php';
header('Content-Type: application/json; charset=utf-8');
function result(array $b,int $status=200):void {http_response_code($status);echo json_encode($b,JSON_UNESCAPED_UNICODE);exit;}
if(($_SERVER['REQUEST_METHOD']??'')!=='POST')result(['error'=>'Method not allowed'],405);
$u=control_user();if(!$u)result(['error'=>'غير مصرح'],401);
$b=json_decode(file_get_contents('php://input'),true);if(!is_array($b)||!hash_equals($_SESSION['auth_csrf']??'',(string)($b['csrf']??'')))result(['error'=>'انتهت صلاحية النموذج'],403);
foreach(['password','newUsername','newPassword','confirmation','code']as $k)if(isset($b[$k])&&!is_string($b[$k]))result(['error'=>'بيانات غير صالحة'],400);
$username=trim($b['newUsername']??'');$password=$b['newPassword']??'';$argon=defined('PASSWORD_ARGON2ID');$max=$argon?1024:72;
if($username===''&&$password==='')result(['error'=>'غيّر اسم المستخدم أو كلمة المرور على الأقل'],400);
if(strlen($username)>($argon?100:72)||($password!==''&&(strlen($password)<16||strlen($password)>$max||$password!==($b['confirmation']??'')))||strlen($b['password']??'')>1024)result(['error'=>'تحقق من الاسم وكلمة المرور الجديدة وتأكيدها (16 حرفاً على الأقل، وحد الاستضافة قد يكون 72 بايت)'],400);
$ip=$_SERVER['REMOTE_ADDR']??'local';if(auth_locked('control','control',$ip))result(['error'=>'تم إيقاف المحاولات مؤقتاً'],429);
$id=(string)$u['id'];$row=qone('SELECT * FROM control_users WHERE id=?',[$id]);
if(!$row||!password_verify($b['password']??'',$row['pass_hash'])||(str_starts_with($row['pass_hash'],'$2')&&strlen($b['password']??'')>72)||(auth_totp_enabled('control',$id)&&!auth_totp_verify('control',$id,$b['code']??''))){auth_failure('control','control',$ip);result(['error'=>'تعذر تأكيد هويتك. تحقق من كلمة المرور الحالية ورمز المصادقة، ثم حاول مجدداً.'],401);}
try{$algo=$argon?PASSWORD_ARGON2ID:PASSWORD_BCRYPT;$opts=$argon?['memory_cost'=>19456,'time_cost'=>2,'threads'=>1]:['cost'=>12];$uh=$username!==''?password_hash($username,$algo,$opts):$row['username'];$ph=$password!==''?password_hash($password,$algo,$opts):$row['pass_hash'];
 $d=db();$d->beginTransaction();q('UPDATE control_users SET username=?,pass_hash=? WHERE id=?',[$uh,$ph,$id]);q("DELETE FROM auth_sessions WHERE panel='control'");q("DELETE FROM auth_challenges WHERE panel='control'");$d->commit();auth_success('control','control',$ip);auth_log('control','control',$_SERVER['HTTP_USER_AGENT']??'','credentials_changed');setcookie('istore_control','',time()-3600,'/');result(['ok'=>true,'relogin'=>true]);
}catch(Throwable $e){if(isset($d)&&$d->inTransaction())$d->rollBack();result(['error'=>'تعذر حفظ البيانات. تحقق من إعدادات الخادم'],503);}
