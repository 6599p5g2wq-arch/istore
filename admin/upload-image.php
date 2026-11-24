<?php
require __DIR__.'/_init.php';require_admin();
if($_SERVER['REQUEST_METHOD']!=='POST')json_response(['error'=>'Method not allowed'],405);
$path=handle_image_upload('file');if(!$path)json_response(['error'=>'تعذر رفع الصورة. استخدم PNG أو JPG أو WebP أو GIF ضمن الحد المسموح.'],400);
json_response(['ok'=>true,'path'=>$path]);
