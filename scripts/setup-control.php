<?php
// CLI only: no browser setup endpoint, no credentials in command arguments.
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
function hidden_input(string $label): string {
 if(PHP_OS_FAMILY==='Windows'){
  fwrite(STDERR,$label);
  $value=shell_exec('powershell.exe -NoProfile -Command "$s=Read-Host -AsSecureString; $p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); try {[Console]::Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($p))} finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p)}"');
  if($value===null)throw new RuntimeException('Private PowerShell terminal required');return rtrim($value,"\r\n");
 }
 if(!function_exists('stream_isatty')||!stream_isatty(STDIN))throw new RuntimeException('Interactive private terminal required');
 fwrite(STDERR,$label);$state=shell_exec('stty -g');if(!$state)throw new RuntimeException('Cannot disable terminal echo');
 system('stty -echo',$code);if($code!==0)throw new RuntimeException('Cannot disable terminal echo');
 try{$value=fgets(STDIN);if($value===false)throw new RuntimeException('Input cancelled');return rtrim($value,"\r\n");}finally{system('stty '.escapeshellarg(trim($state)));fwrite(STDERR,"\n");}
}
try{
 $root=dirname(__DIR__);define('APP_ROOT',$root);require $root.'/config.php';require $root.'/includes/db.php';
 $username=trim(hidden_input('Control username (hidden): '));$password=hidden_input('New password, at least 16 characters (hidden): ');$confirm=hidden_input('Repeat password (hidden): ');
 $argon=defined('PASSWORD_ARGON2ID');if($username===''||strlen($username)>($argon?100:72)||strlen($password)<16||strlen($password)>($argon?1024:72)||$password!==$confirm)throw new RuntimeException('Invalid username/password length or confirmation mismatch. Bcrypt hosts support at most 72 bytes.');
 $algo=$argon?PASSWORD_ARGON2ID:PASSWORD_BCRYPT;$options=$argon?['memory_cost'=>19456,'time_cost'=>2,'threads'=>1]:['cost'=>12];
 $userHash=password_hash($username,$algo,$options);$passHash=password_hash($password,$algo,$options);unset($password,$confirm,$username);
 $d=db();$d->exec('ALTER TABLE control_users MODIFY username VARCHAR(255) NOT NULL');require $root.'/includes/security.php';security_db();
 $d->beginTransaction();$rows=$d->query('SELECT id FROM control_users FOR UPDATE')->fetchAll();if(count($rows)>1)throw new RuntimeException('Multiple control accounts require manual review');
 if($rows)q('UPDATE control_users SET username=?,pass_hash=? WHERE id=?',[$userHash,$passHash,$rows[0]['id']]);else q('INSERT INTO control_users(username,pass_hash) VALUES(?,?)',[$userHash,$passHash]);
 q("DELETE FROM auth_sessions WHERE panel='control'");q("DELETE FROM auth_challenges WHERE panel='control'");q("UPDATE auth_activity SET username='control' WHERE panel='control'");$d->commit();
 fwrite(STDOUT,"Saved salted hashes only. Existing control sessions revoked; 2FA and recovery codes retained. Remove old CONTROL_USERNAME / CONTROL_PASSWORD from any old config or backups. No browser setup endpoint exists.\n");
}catch(Throwable $e){if(isset($d)&&$d->inTransaction())$d->rollBack();fwrite(STDERR,'Setup failed: '.$e->getMessage()."\n");exit(1);}
