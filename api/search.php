<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$q = trim($_GET['q'] ?? '');
$results = [];
if (mb_strlen($q) >= 2) {
    $like = '%' . $q . '%';
    $results = qall(
      'SELECT p.id, p.name, p.slug, p.price, p.image FROM products p
       WHERE p.active = 1 AND (p.name LIKE ? OR p.description LIKE ?) ORDER BY p.featured DESC, p.id DESC LIMIT 8',
      [$like, $like]);
    foreach ($results as &$r) { $r['image'] = img_url($r['image']); $r['price'] = (float)$r['price']; }
    unset($r);
}
json_response(['ok' => true, 'results' => $results]);
