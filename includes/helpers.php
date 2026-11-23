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

// خيارات عرض الأسعار من صفحة «الإعدادات»
function price_opts(): array {
    static $o = null;
    if ($o !== null) return $o;
    $d = setting('currency_decimals', 'auto');
    $rate = (float)setting('currency2_rate', '0');
    return $o = [
        'pos' => setting('currency_pos', 'after') === 'before' ? 'before' : 'after',
        'dec' => in_array($d, ['0', '2'], true) ? $d : 'auto',
        'sym2' => trim(setting('currency2_symbol', '')),
        'rate2' => $rate > 0 ? $rate : 0,
    ];
}

function format_price($value, ?string $currency = null): string {
    $currency = $currency ?? (setting('currency', 'د.ل') ?: 'د.ل');
    $o = price_opts();
    $v = (float)$value;
    if ($o['dec'] === '0') $n = number_format($v, 0);
    elseif ($o['dec'] === '2') $n = number_format($v, 2);
    else $n = (floor($v) == $v) ? number_format($v, 0) : number_format($v, 2);
    return $o['pos'] === 'before' ? $currency . ' ' . $n : $n . ' ' . $currency;
}

// السعر بالعملة الثانية (تقريبي) أو نص فارغ إن لم تُفعَّل
function format_secondary($value): string {
    $o = price_opts();
    if ($o['sym2'] === '' || !$o['rate2']) return '';
    $n = number_format((float)$value / $o['rate2'], 2);
    return $o['pos'] === 'before' ? '≈ ' . $o['sym2'] . ' ' . $n : '≈ ' . $n . ' ' . $o['sym2'];
}

// وضع الصيانة: مفعّل والزائر ليس مشرفاً مسجلاً
function maintenance_on(): bool {
    return setting('maintenance_enabled', '0') === '1' && !admin_user();
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

function validate_coupon(string $code, float $subtotal, ?int $customerId = null): array {
    $c = qone('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?)', [trim($code)]);
    if (!$c || !$c['active']) return ['ok' => false, 'error' => 'كود الخصم غير صالح'];
    // كوبون خاص بزبون محدد (مثل كوبون الترحيب)
    if (!empty($c['customer_id']) && (int)$c['customer_id'] !== (int)$customerId) return ['ok' => false, 'error' => 'كود الخصم غير صالح'];
    $today = date('Y-m-d');
    if (!empty($c['starts_at']) && $c['starts_at'] > $today) return ['ok' => false, 'error' => 'هذا الكود لم يبدأ بعد'];
    if ($c['expires_at'] && $c['expires_at'] < $today) return ['ok' => false, 'error' => 'انتهت صلاحية هذا الكود'];
    if ((int)$c['max_uses'] > 0 && (int)$c['used_count'] >= (int)$c['max_uses']) return ['ok' => false, 'error' => 'انتهى عدد مرات استخدام هذا الكود'];
    if ($subtotal < (float)$c['min_total']) return ['ok' => false, 'error' => 'هذا الكود يتطلب حد أدنى للطلب ' . format_price($c['min_total'])];
    $discount = $c['kind'] === 'percent' ? round($subtotal * ((float)$c['value'] / 100)) : min((float)$c['value'], $subtotal);
    if ($discount <= 0) return ['ok' => false, 'error' => 'كود الخصم غير صالح'];
    return ['ok' => true, 'discount' => $discount, 'coupon' => $c];
}

// ===== الولاء / الترحيب / VIP =====
function program(): array {
    return [
        'welcome_enabled' => setting('welcome_enabled', '0') === '1',
        'welcome_percent' => (float)setting('welcome_percent', '10'),
        'welcome_days' => (int)setting('welcome_days', '30'),
        'welcome_max_uses' => (int)setting('welcome_max_uses', '1'),
        'loyalty_enabled' => setting('loyalty_enabled', '0') === '1',
        'loyalty_per_lyd' => (float)setting('loyalty_per_lyd', '1'),
        'redeem_points' => max(1, (int)setting('loyalty_redeem_points', '100')),
        'redeem_value' => (float)setting('loyalty_redeem_value', '5'),
        'vip_enabled' => setting('vip_enabled', '0') === '1',
        'vip_threshold' => (float)setting('vip_threshold', '2000'),
    ];
}

function add_points(int $customerId, int $delta, string $reason, ?int $orderId = null): void {
    $cur = (int)(qone('SELECT points FROM customers WHERE id = ?', [$customerId])['points'] ?? 0);
    $next = max(0, $cur + $delta);
    q('UPDATE customers SET points = ? WHERE id = ?', [$next, $customerId]);
    q('INSERT INTO points_log (customer_id, delta, reason, order_id) VALUES (?, ?, ?, ?)', [$customerId, $next - $cur, mb_substr($reason, 0, 200), $orderId]);
}

function is_vip(float $spent, $override, ?array $p = null): bool {
    $p = $p ?? program();
    if ($override !== null && (int)$override === 1) return true;
    if ($override !== null && (int)$override === 0) return false;
    return $p['vip_enabled'] && $spent >= $p['vip_threshold'];
}

function create_welcome_coupon(int $customerId): ?string {
    $p = program();
    if (!$p['welcome_enabled']) return null;
    $code = 'WELCOME-' . strtoupper(bin2hex(random_bytes(3)));
    $exp = date('Y-m-d', time() + $p['welcome_days'] * 86400);
    q("INSERT INTO coupons (code, kind, value, min_total, expires_at, max_uses, customer_id) VALUES (?, 'percent', ?, 0, ?, ?, ?)", [$code, $p['welcome_percent'], $exp, $p['welcome_max_uses'], $customerId]);
    return $code;
}

// نقاط الولاء المستبدلة: عدد النقاط والخصم (كتل كاملة فقط، ولا يتجاوز المبلغ المتبقي)
function points_redemption(int $customerId, float $base, array $p): array {
    if (!$p['loyalty_enabled']) return [0, 0.0];
    $bal = (int)(qone('SELECT points FROM customers WHERE id = ? FOR UPDATE', [$customerId])['points'] ?? 0);
    $blocks = min(intdiv($bal, $p['redeem_points']), (int)floor($base / max(0.01, $p['redeem_value'])));
    if ($blocks <= 0) return [0, 0.0];
    return [$blocks * $p['redeem_points'], $blocks * $p['redeem_value']];
}

// آثار تغيير حالة الطلب على النقاط وعدّاد الكوبون
function apply_order_status_effects(int $orderId, string $old, string $new): void {
    if ($old === $new) return;
    $o = qone('SELECT * FROM orders WHERE id = ?', [$orderId]);
    if (!$o) return;
    $p = program();
    $cid = $o['customer_id'] ? (int)$o['customer_id'] : 0;
    if ($new === 'cancelled') {
        if ($o['coupon_code'] && (float)$o['discount'] > 0) q('UPDATE coupons SET used_count = GREATEST(0, used_count - 1) WHERE UPPER(code) = UPPER(?)', [$o['coupon_code']]);
        if ($cid) {
            if ((int)$o['points_used'] > 0 && !$o['points_refunded']) { add_points($cid, (int)$o['points_used'], 'إرجاع نقاط طلب ملغي', $orderId); q('UPDATE orders SET points_refunded = 1 WHERE id = ?', [$orderId]); }
            if ((int)$o['points_awarded'] > 0) { add_points($cid, -(int)$o['points_awarded'], 'سحب نقاط طلب ملغي', $orderId); q('UPDATE orders SET points_awarded = 0 WHERE id = ?', [$orderId]); }
        }
        return;
    }
    if ($old === 'cancelled') {
        if ($o['coupon_code'] && (float)$o['discount'] > 0) q('UPDATE coupons SET used_count = used_count + 1 WHERE UPPER(code) = UPPER(?)', [$o['coupon_code']]);
        if ($cid && $o['points_refunded']) { add_points($cid, -(int)$o['points_used'], 'خصم نقاط بعد إعادة تفعيل الطلب', $orderId); q('UPDATE orders SET points_refunded = 0 WHERE id = ?', [$orderId]); }
    }
    if ($new === 'delivered' && $cid && $p['loyalty_enabled'] && !(int)$o['points_awarded']) {
        $earned = (int)floor(max(0, (float)$o['subtotal'] - (float)$o['discount'] - (float)$o['points_discount']) * $p['loyalty_per_lyd']);
        if ($earned > 0) { add_points($cid, $earned, 'نقاط طلب مكتمل', $orderId); q('UPDATE orders SET points_awarded = ? WHERE id = ?', [$earned, $orderId]); }
    }
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

// توحيد الأرقام الليبية: 09XXXXXXXX / 9XXXXXXXX / +2189XXXXXXXX / 002189XXXXXXXX  =>  +2189XXXXXXXX (أو null)
function normalize_libyan_phone(string $input): ?string {
    $t = strtr($input, ['٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9']);
    $t = preg_replace('/[\s\-().]/u', '', $t);
    if (str_starts_with($t, '+')) $d = substr($t, 1);
    elseif (str_starts_with($t, '00')) $d = substr($t, 2);
    else $d = $t;
    if ($d === '' || !ctype_digit($d)) return null;
    if (str_starts_with($d, '218')) $rest = substr($d, 3);
    elseif (str_starts_with($d, '0')) $rest = substr($d, 1);
    else $rest = $d;
    if (str_starts_with($rest, '0')) $rest = substr($rest, 1);
    return preg_match('/^9\d{8}$/', $rest) ? '+218' . $rest : null;
}

// رقم واتساب (أرقام فقط) من أي رقم محفوظ
function wa_number(string $phone): string {
    $n = normalize_libyan_phone($phone);
    if ($n) return substr($n, 1);
    return preg_replace('/\D+/', '', preg_replace('/^0/', '218', $phone));
}

// حد المحاولات (في قاعدة البيانات): true إذا تجاوز $max خلال $windowSec
function rate_limited(string $key, int $max = 8, int $windowSec = 900): bool {
    $key = substr($key, 0, 190);
    $row = qone('SELECT cnt, reset_at FROM login_attempts WHERE k = ?', [$key]);
    if (!$row || strtotime($row['reset_at']) < time()) {
        q('REPLACE INTO login_attempts (k, cnt, reset_at) VALUES (?, 1, ?)', [$key, date('Y-m-d H:i:s', time() + $windowSec)]);
        return false;
    }
    q('UPDATE login_attempts SET cnt = cnt + 1 WHERE k = ?', [$key]);
    return ((int)$row['cnt'] + 1) > $max;
}

function rate_reset(string $key): void {
    q('DELETE FROM login_attempts WHERE k = ?', [substr($key, 0, 190)]);
}

function client_ip(): string {
    $f = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    return $f !== '' ? trim(explode(',', $f)[0]) : ($_SERVER['REMOTE_ADDR'] ?? 'local');
}
