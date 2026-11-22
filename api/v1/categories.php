<?php
// GET التصنيفات
require_once __DIR__ . '/_api.php';
if (api_method() !== 'GET') api_fail('Method not allowed', 405);
$rows = qall('SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.active = 1) AS products_count FROM categories c WHERE c.active = 1 ORDER BY c.sort_order, c.name');
api_ok(['categories' => array_map(fn($c) => [
    'id' => (int)$c['id'], 'name' => $c['name'], 'slug' => $c['slug'], 'description' => $c['description'],
    'image' => $c['image'] ? img_url($c['image']) : '', 'products_count' => (int)$c['products_count'],
], $rows)]);
