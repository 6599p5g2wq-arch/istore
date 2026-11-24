<?php
require_once __DIR__.'/_init.php';
if(!admin_user()){http_response_code(401);header('Content-Type: application/json; charset=utf-8');echo json_encode(['error'=>'انتهت الجلسة. سجّل الدخول مجدداً']);exit;}
// Change only this map to match the local sales system's import headers.
$columnList=json_decode(file_get_contents(APP_ROOT.'/includes/orders-export-columns.json'),true);$columns=array_column($columnList,1,0);
$selected=isset($_GET['columns'])?explode(',',(string)$_GET['columns']):array_keys($columns);
if(!$selected||array_diff($selected,array_keys($columns))){http_response_code(400);header('Content-Type: application/json; charset=utf-8');echo json_encode(['error'=>'اختر عموداً واحداً على الأقل، بأسماء صحيحة']);exit;}
$columns=array_intersect_key($columns,array_flip($selected));
$labels=['new'=>'جديد','confirmed'=>'مؤكد','shipped'=>'تم الشحن','delivered'=>'تم التوصيل','cancelled'=>'ملغي'];
$from=(string)($_GET['from']??'');$to=(string)($_GET['to']??'');$status=(string)($_GET['status']??'');
function export_date_valid($s){$d=DateTimeImmutable::createFromFormat('!Y-m-d',$s);return $d&&$d->format('Y-m-d')===$s;}
$error='';if(($from&&!export_date_valid($from))||($to&&!export_date_valid($to)))$error='تاريخ غير صالح';elseif($from&&$to&&$from>$to)$error='تاريخ البداية يجب ألا يتجاوز النهاية';elseif($status&&!isset($labels[$status]))$error='حالة غير صالحة';
if($error){http_response_code(400);header('Content-Type: application/json; charset=utf-8');echo json_encode(['error'=>$error],JSON_UNESCAPED_UNICODE);exit;}
// MySQL DATETIME uses the DB session wall clock. Override if historical rows used another offset.
$tz=db()->query('SELECT TIMESTAMPDIFF(MINUTE,UTC_TIMESTAMP(),NOW()) minutes')->fetch();
$minutes=(int)$tz['minutes'];$autoOffset=sprintf('%s%02d:%02d',$minutes<0?'-':'+',intdiv(abs($minutes),60),abs($minutes)%60);
$offset=defined('ORDER_EXPORT_DB_OFFSET')?ORDER_EXPORT_DB_OFFSET:$autoOffset;
$ids=isset($_GET['ids'])?explode(',',(string)$_GET['ids']):[];if(isset($_GET['ids'])&&(!$ids||count($ids)>500||array_filter($ids,fn($n)=>!ctype_digit($n)||(int)$n<=0))){http_response_code(400);header('Content-Type: application/json; charset=utf-8');echo json_encode(['error'=>'تحديد الطلبات غير صالح']);exit;}
$dateExpr='CONVERT_TZ(o.created_at, ?, ?)';$args=[$offset,'+02:00'];$conds=[];
if($ids){$conds[]='o.id IN ('.implode(',',array_fill(0,count($ids),'?')).')';array_push($args,...$ids);}
if(!$ids&&$from){$conds[]='DATE('.$dateExpr.')>=?';array_push($args,$offset,'+02:00',$from);}
if(!$ids&&$to){$conds[]='DATE('.$dateExpr.')<=?';array_push($args,$offset,'+02:00',$to);}
if(!$ids&&$status){$conds[]='o.status=?';$args[]=$status;}
$sql='SELECT o.*,o.id order_id,'.$dateExpr.' date,i.id item_id,i.product_id,i.variant_id,i.name,i.variant_label,i.qty,i.price,(i.qty*i.price) line_total FROM orders o JOIN order_items i ON i.order_id=o.id'.($conds?' WHERE '.implode(' AND ',$conds):'').' ORDER BY o.id DESC,i.id ASC';
$stmt=db()->prepare($sql);$stmt->execute($args);
header('Content-Type: text/csv; charset=utf-8');header('Content-Disposition: attachment; filename="orders-export.csv"');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
$out=fopen('php://output','w');fwrite($out,"\xEF\xBB\xBF");
function export_cell($v){$s=(string)($v??'');if(preg_match('/^[\s\x00-\x1f]*[=+@-]/u',$s))$s="'".$s;return '"'.str_replace('"','""',$s).'"';}
function export_csv_line($out,$row){fwrite($out,implode(',',array_map('export_cell',$row))."\r\n");}
export_csv_line($out,array_keys($columns));
while($row=$stmt->fetch()){ $row['status_label']=$labels[$row['status']]??$row['status'];$history=qall('SELECT status,created_at FROM order_status_log WHERE order_id=? ORDER BY id',[$row['order_id']]);$row['status_history']=implode(' | ',array_map(fn($h)=>$h['status'].' @ '.$h['created_at'],$history));$row['payment']='الدفع عند الاستلام';$values=[];foreach($columns as $key=>$label)$values[]=$row[$key]??'';export_csv_line($out,$values);}
fclose($out);exit;
