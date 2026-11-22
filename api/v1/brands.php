<?php
// GET الماركات
require_once __DIR__ . '/_api.php';
if (api_method() !== 'GET') api_fail('Method not allowed', 405);
$rows = qall('SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.active = 1) AS products_count FROM brands b WHERE b.active = 1 ORDER BY b.sort_order, b.name');
api_ok(['brands' => array_map(fn($b) => [
    'id' => (int)$b['id'], 'name' => $b['name'], 'slug' => $b['slug'],
    'image' => $b['image'] ? img_url($b['image']) : '', 'products_count' => (int)$b['products_count'],
], $rows)]);
