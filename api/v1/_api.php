<?php
// أساس واجهة REST API v1 لتطبيق الموبايل — JSON فقط، مصادقة بتوكن Bearer
require_once dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_once APP_ROOT . '/includes/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

function api_ok($data = [], int $status = 200): void {
    http_response_code($status);
    echo json_encode(['ok' => true] + (is_array($data) ? $data : ['data' => $data]), JSON_UNESCAPED_UNICODE);
    exit;
}

function api_fail(string $error, int $status = 400): void {
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $error], JSON_UNESCAPED_UNICODE);
    exit;
}

function api_body(): array {
    if((int)($_SERVER['CONTENT_LENGTH']??0)>1048576)api_fail('الطلب كبير جدا',413);
    $b = json_decode(file_get_contents('php://input',false,null,0,1048577), true);
    return is_array($b) ? $b : [];
}

function api_method(): string { return $_SERVER['REQUEST_METHOD'] ?? 'GET'; }

// إنشاء توكن جديد لعميل
function api_issue_token(int $customerId): string {
    $token = bin2hex(random_bytes(32));
    q('INSERT INTO api_tokens (token, customer_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 90 DAY))', [$token, $customerId]);
    return $token;
}

// العميل من توكن Bearer — null للزائر
function api_customer() {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+([a-f0-9]{64})$/i', $h, $m)) return null;
    return qone(
        'SELECT c.id, c.name, c.email, c.phone FROM api_tokens t JOIN customers c ON c.id = t.customer_id WHERE t.token = ? AND t.expires_at > NOW() AND c.blocked = 0',
        [strtolower($m[1])]);
}

function api_require_customer() {
    $c = api_customer();
    if (!$c) api_fail('مطلوب تسجيل الدخول', 401);
    return $c;
}

function api_logout_token(): void {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+([a-f0-9]{64})$/i', $h, $m)) q('DELETE FROM api_tokens WHERE token = ?', [strtolower($m[1])]);
}

// تمثيل منتج موحد للتطبيق
function api_product(array $p, bool $withVariants = false): array {
    $options = parse_options($p['options'] ?? '');
    $r = [
        'id' => (int)$p['id'],
        'name' => $p['name'],
        'slug' => $p['slug'],
        'description' => $p['description'] ?? '',
        'price' => (float)$p['price'],
        'old_price' => $p['old_price'] !== null ? (float)$p['old_price'] : null,
        'stock' => (int)$p['stock'],
        'image' => img_url($p['image']),
        'images' => array_map('img_url', array_filter(json_decode($p['images'] ?? '[]', true) ?: [])),
        'badge' => $p['badge'],
        'featured' => (bool)$p['featured'],
        'rating' => (float)$p['rating'],
        'category' => $p['category_slug'] ?? null,
        'category_name' => $p['category_name'] ?? null,
        'brand' => $p['brand_slug'] ?? null,
        'brand_name' => $p['brand_name'] ?? null,
        'options' => $options,
        'has_variants' => !empty($options),
    ];
    if ($withVariants && $options) {
        $r['variants'] = array_map(fn($v) => [
            'id' => (int)$v['id'],
            'label' => $v['label'],
            'options' => json_decode($v['options'] ?: '{}', true) ?: [],
            'price' => $v['price'] !== null ? (float)$v['price'] : null,
            'stock' => (int)$v['stock'],
            'image' => $v['image'] ? img_url($v['image']) : null,
        ], get_variants((int)$p['id']));
    }
    return $r;
}
