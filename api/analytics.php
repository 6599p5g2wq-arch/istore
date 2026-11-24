<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
if(rate_limited('analytics:'.client_ip(),120))json_response(['error'=>'محاولات كثيرة، حاول لاحقا'],429);
$b = read_json_body();
$path = mb_substr((string)($b['path'] ?? ''), 0, 200);
if ($path === '' || str_starts_with($path, '/admin') || str_starts_with($path, '/api')) json_response(['ok' => false]);
$referrer = mb_substr((string)($b['referrer'] ?? ''), 0, 300);
q('INSERT INTO page_views (path, referrer) VALUES (?, ?)', [$path, $referrer]);
json_response(['ok' => true]);
