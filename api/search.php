<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
if(!is_string($_GET['q']??''))json_response(['error'=>'بحث غير صالح'],400);
$q=trim($_GET['q']??'');if(mb_strlen($q)>120)json_response(['error'=>'البحث طويل جداً'],400);
if($q!==''&&rate_limited('search:'.client_ip(),120,60))json_response(['error'=>'محاولات كثيرة، انتظر قليلاً'],429);
$results = [];
if (mb_strlen($q) >= 1) {
    $like = '%' . $q . '%';
    $results = qall(
      'SELECT p.id, p.name, p.slug, p.price, p.image FROM products p
       WHERE p.active = 1 AND (p.name LIKE ? OR p.description LIKE ?) ORDER BY p.id ASC LIMIT 8',
      [$like, $like]);
    foreach ($results as &$r) { $r['image'] = img_url($r['image']); $r['price'] = (float)$r['price']; }
    unset($r);
}
json_response(['ok' => true, 'results' => $results]);
