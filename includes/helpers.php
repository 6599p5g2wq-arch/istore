<?php
// دوال مساعدة مشتركة

function e(?string $s): string {
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}

function settings(): array {
    static $cache = null;
    if ($cache !== null) return $cache;
    $cache = [];
    foreach (qall('SELECT `key`, `value` FROM settings') as $r) $cache[$r['key']] = $r['value'];
    return $cache;
}

function setting(string $key, string $fallback = ''): string {
    $s = settings();
    return $s[$key] ?? $fallback;
}

function set_setting(string $key, string $value): void {
    q('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)', [$key, $value]);
}

function format_price($value, ?string $currency = null): string {
    $currency = $currency ?? (setting('currency', 'د.ل') ?: 'د.ل');
    $v = (float)$value;
    $n = (floor($v) == $v) ? number_format($v, 0) : number_format($v, 2);
    return $n . ' ' . $currency;
}

function format_date(?string $iso): string {
    if (!$iso) return '';
    $ts = strtotime($iso);
    if (!$ts) return $iso;
    $months = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return date('j', $ts) . ' ' . $months[(int)date('n', $ts)] . ' ' . date('Y', $ts) . '، ' . date('g:i', $ts) . ' ' . (date('a', $ts) === 'am' ? 'ص' : 'م');
}

function categories(bool $activeOnly = true): array {
    return qall('SELECT * FROM categories' . ($activeOnly ? ' WHERE active = 1' : '') . ' ORDER BY sort_order, id');
}

function get_product(string $slug) {
    return qone(
        'SELECT p.*, c.name AS category_name, c.slug AS category_slug, b.name AS brand_name, b.slug AS brand_slug
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN brands b ON b.id = p.brand_id
         WHERE p.slug = ? AND p.active = 1', [$slug]);
}

function product_images(array $p): array {
    $imgs = json_decode($p['images'] ?? '[]', true);
    if (!is_array($imgs)) $imgs = [];
    $imgs = array_values(array_filter($imgs));
    if (!$imgs && $p['image']) $imgs = [$p['image']];
    return $imgs;
}

function img_url(string $path): string {
    if ($path === '') return '';
    if (preg_match('#^https?://#', $path)) return $path;
    return url(ltrim($path, '/'));
}

function order_status_label(string $s): string {
    return ['new' => 'جديد', 'confirmed' => 'مؤكد', 'shipped' => 'تم الشحن', 'delivered' => 'تم التوصيل', 'cancelled' => 'ملغي'][$s] ?? $s;
}

function order_status_class(string $s): string {
    return [
        'new' => 'bg-amber-100 text-amber-700',
        'confirmed' => 'bg-blue-100 text-blue-700',
        'shipped' => 'bg-purple-100 text-purple-700',
        'delivered' => 'bg-emerald-100 text-emerald-700',
        'cancelled' => 'bg-red-100 text-red-700',
    ][$s] ?? 'bg-neutral-100 text-neutral-600';
}

function validate_coupon(string $code, float $subtotal): array {
    $c = qone('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?)', [trim($code)]);
    if (!$c || !$c['active']) return ['ok' => false, 'error' => 'كود الخصم غير صالح'];
    if ($c['expires_at'] && $c['expires_at'] < date('Y-m-d')) return ['ok' => false, 'error' => 'انتهت صلاحية هذا الكود'];
    if ($subtotal < (float)$c['min_total']) return ['ok' => false, 'error' => 'هذا الكود يتطلب حد أدنى للطلب ' . format_price($c['min_total'])];
    $discount = $c['kind'] === 'percent' ? round($subtotal * ((float)$c['value'] / 100)) : min((float)$c['value'], $subtotal);
    if ($discount <= 0) return ['ok' => false, 'error' => 'كود الخصم غير صالح'];
    return ['ok' => true, 'discount' => $discount, 'coupon' => $c];
}

function random_token(int $bytes = 32): string {
    return bin2hex(random_bytes($bytes));
}

function json_response($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_json_body(): array {
    $raw = file_get_contents('php://input');
    $b = json_decode($raw ?: '[]', true);
    return is_array($b) ? $b : [];
}

// إشعار طلب جديد عبر Resend (اختياري — يعمل فقط إذا ضبطت المفتاح في config.php)
function notify_new_order(array $o): void {
    if (!defined('RESEND_API_KEY') || !RESEND_API_KEY || !defined('NOTIFY_EMAIL') || !NOTIFY_EMAIL) return;
    $lines = [];
    foreach ($o['items'] as $it) $lines[] = '• ' . $it['name'] . ' × ' . $it['qty'] . ' — ' . format_price($it['price'] * $it['qty']);
    $html = '<div dir="rtl" style="font-family:sans-serif">'
        . '<h2>طلب جديد ' . e($o['code']) . '</h2>'
        . '<p><b>الاسم:</b> ' . e($o['customer']) . '<br><b>الهاتف:</b> ' . e($o['phone'])
        . '<br><b>المدينة:</b> ' . e($o['city']) . '<br><b>العنوان:</b> ' . e($o['address'])
        . ($o['notes'] ? '<br><b>ملاحظات:</b> ' . e($o['notes']) : '') . '</p>'
        . '<p>' . implode('<br>', $lines) . '</p>'
        . '<p>المجموع: ' . format_price($o['subtotal'])
        . ($o['discount'] > 0 ? '<br>الخصم' . ($o['couponCode'] ? ' (' . e($o['couponCode']) . ')' : '') . ': -' . format_price($o['discount']) : '')
        . '<br>التوصيل: ' . format_price($o['deliveryFee'])
        . '<br><b>الإجمالي: ' . format_price($o['total']) . '</b></p></div>';
    $payload = json_encode([
        'from' => 'آي ستور <onboarding@resend.dev>',
        'to' => [NOTIFY_EMAIL],
        'subject' => 'طلب جديد ' . $o['code'] . ' — ' . $o['customer'],
        'html' => $html,
    ], JSON_UNESCAPED_UNICODE);
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . RESEND_API_KEY, 'Content-Type: application/json'],
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_TIMEOUT => 8,
    ]);
    @curl_exec($ch);
    curl_close($ch);
}

// تسجيل زيارة صفحة (إحصائيات لوحة التحكم)
function track_view(): void {
    $path = substr($_SERVER['REQUEST_URI'] ?? '/', 0, 490);
    $ref = substr($_SERVER['HTTP_REFERER'] ?? '', 0, 490);
    try { q('INSERT INTO page_views (path, referrer) VALUES (?, ?)', [$path, $ref]); } catch (Throwable $e) {}
}
