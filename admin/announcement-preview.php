<?php
require __DIR__.'/_init.php';require_admin();require APP_ROOT.'/includes/announcement.php';
if($_SERVER['REQUEST_METHOD']!=='POST'){http_response_code(405);exit;}$b=read_json_body();$c=announce_sanitize($b);header('Content-Type: text/html; charset=utf-8');
?><!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><link rel="stylesheet" href="<?=e(url('assets/css/tailwind.css'))?>"><style>body{margin:0;font-family:Cairo,sans-serif}a{pointer-events:none}.ann-group{min-width:100%!important}</style></head><body><?php announce_render($c);?></body></html>
