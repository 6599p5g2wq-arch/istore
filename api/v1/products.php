<?php
// GET منتجات: ?q=&category=&brand=&featured=1&offers=1&sort=newest|price_asc|price_desc|rating&min=&max=&page=&per_page=
// GET ?slug= أو ?id= لمنتج واحد مع تقييماته
require_once __DIR__ . '/_api.php';
if (api_method() !== 'GET') api_fail('Method not allowed', 405);

$base = 'SELECT p.*, c.slug AS category_slug, c.name AS category_name, b.slug AS brand_slug, b.name AS brand_name
         FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id WHERE p.active = 1';

if (isset($_GET['slug']) || isset($_GET['id'])) {
    $p = isset($_GET['id'])
        ? qone($base . ' AND p.id = ?', [(int)$_GET['id']])
        : qone($base . ' AND p.slug = ?', [trim($_GET['slug'])]);
    if (!$p) api_fail('المنتج غير موجود', 404);
    $reviews = qall('SELECT customer_name, rating, comment, created_at FROM reviews WHERE product_id = ? AND approved = 1 ORDER BY id DESC LIMIT 50', [(int)$p['id']]);
    api_ok(['product' => api_product($p), 'reviews' => $reviews]);
}

$where = ''; $args = [];
if (($q = trim($_GET['q'] ?? '')) !== '') { $where .= ' AND (p.name LIKE ? OR p.description LIKE ?)'; $args[] = "%$q%"; $args[] = "%$q%"; }
if (($cat = trim($_GET['category'] ?? '')) !== '') { $where .= ' AND c.slug = ?'; $args[] = $cat; }
if (($brand = trim($_GET['brand'] ?? '')) !== '') { $where .= ' AND b.slug = ?'; $args[] = $brand; }
if (!empty($_GET['featured'])) $where .= ' AND p.featured = 1';
if (!empty($_GET['offers'])) $where .= ' AND p.old_price IS NOT NULL AND p.old_price > p.price';
if (($min = (float)($_GET['min'] ?? 0)) > 0) { $where .= ' AND p.price >= ?'; $args[] = $min; }
if (($max = (float)($_GET['max'] ?? 0)) > 0) { $where .= ' AND p.price <= ?'; $args[] = $max; }

$sorts = [
    'newest' => 'p.id DESC',
    'price_asc' => 'p.price ASC',
    'price_desc' => 'p.price DESC',
    'rating' => 'p.rating DESC, p.id DESC',
    'popular' => 'p.featured DESC, p.rating DESC, p.id DESC',
];
$orderBy = $sorts[$_GET['sort'] ?? ''] ?? 'p.featured DESC, p.id DESC';

$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = min(50, max(1, (int)($_GET['per_page'] ?? 20)));
$total = (int)qone("SELECT COUNT(*) c FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id WHERE p.active = 1 $where", $args)['c'];
$rows = qall("$base $where ORDER BY $orderBy LIMIT $perPage OFFSET " . (($page - 1) * $perPage), $args);
api_ok([
    'products' => array_map('api_product', $rows),
    'pagination' => ['page' => $page, 'per_page' => $perPage, 'total' => $total, 'pages' => (int)ceil($total / $perPage)],
]);
