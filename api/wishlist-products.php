<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
require APP_ROOT . '/includes/icons.php';
require APP_ROOT . '/includes/product-card.php';
if (rate_limited('wishlist-products:' . client_ip(), 120, 60)) json_response(['error' => 'محاولات كثيرة، انتظر قليلاً'], 429);
$raw = $_GET['ids'] ?? '';
if (!is_string($raw)) json_response(['products' => []]);
$ids = [];
foreach (explode(',', $raw) as $x) { $n = (int)$x; if ($n > 0 && (string)$n === trim($x)) $ids[$n] = $n; if (count($ids) >= 100) break; }
if (!$ids) json_response(['products' => [], 'cards' => new stdClass()]);
$ids = array_values($ids);
$rows = qall('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.active = 1 AND p.id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')', $ids);
$cards = [];
foreach ($rows as $p) $cards[(string)(int)$p['id']] = product_card($p);
header('Cache-Control: no-store');
json_response(['cards' => $cards ?: new stdClass()]);
