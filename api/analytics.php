<?php
require dirname(__DIR__).'/includes/bootstrap.php';
if(($_SERVER['REQUEST_METHOD']??'GET')!=='POST')json_response(['error'=>'Method not allowed'],405);
if(rate_limited('analytics:'.client_ip(),120,60))json_response(['error'=>'محاولات كثيرة، حاول لاحقا'],429);
$b=read_json_body();$path=is_string($b['path']??null)?mb_substr($b['path'],0,200):'';
if(!$path||preg_match('#/(admin|control|api)(/|$)#',$path))json_response(['ok'=>false]);
$ref=is_string($b['referrer']??null)?mb_substr($b['referrer'],0,300):'';
q('INSERT INTO page_views(path,referrer) VALUES(?,?)',[$path,$ref]);json_response(['ok'=>true]);
