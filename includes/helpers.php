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
    if(!is_finite($subtotal)||$subtotal<0)return ['ok'=>false,'error'=>'مبلغ غير صالح'];
    $c = qone('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?)'.(db()->inTransaction()?' FOR UPDATE':''), [trim($code)]);
    if (!$c || !$c['active']) return ['ok' => false, 'error' => 'كود الخصم غير صالح'];
    // كوبون خاص بزبون محدد (مثل كوبون الترحيب)
    if (!empty($c['customer_id']) && (int)$c['customer_id'] !== (int)$customerId) return ['ok' => false, 'error' => 'كود الخصم غير صالح'];
    $today = date('Y-m-d');
    if (!empty($c['starts_at']) && $c['starts_at'] > $today) return ['ok' => false, 'error' => 'هذا الكود لم يبدأ بعد'];
    if ($c['expires_at'] && $c['expires_at'] < $today) return ['ok' => false, 'error' => 'انتهت صلاحية هذا الكود'];
    if ((int)$c['max_uses'] > 0 && (int)$c['used_count'] >= (int)$c['max_uses']) return ['ok' => false, 'error' => 'انتهى عدد مرات استخدام هذا الكود'];
    if ($subtotal < (float)$c['min_total']) return ['ok' => false, 'error' => 'هذا الكود يتطلب حد أدنى للطلب ' . format_price($c['min_total'])];
    $discount = $c['kind'] === 'percent' ? round($subtotal * ((float)$c['value'] / 100)) : min((float)$c['value'], $subtotal);
    if (!is_finite($discount) || $discount <= 0 || $discount > $subtotal) return ['ok' => false, 'error' => 'كود الخصم غير صالح'];
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
    $raw = file_get_contents('php://input',false,null,0,1048577);
    if(strlen($raw)>1048576)json_response(['error'=>'الطلب كبير جدا'],413);
    $b = json_decode($raw ?: '[]', true);
    return is_array($b) ? $b : [];
}

// إشعار طلب جديد عبر Resend (اختياري — يعمل فقط إذا ضبطت المفتاح في config.php)
// إعدادات البريد: قاعدة البيانات أولاً ثم ثوابت config.php كاحتياط
function mail_key(): string {
    $k = setting('resend_api_key', '');
    if ($k) return $k;
    return defined('RESEND_API_KEY') ? (string)RESEND_API_KEY : '';
}
function mail_from(): string {
    $f = setting('resend_from', '');
    if ($f) return $f;
    if (defined('RESEND_FROM') && RESEND_FROM) return (string)RESEND_FROM;
    return setting('store_name', 'المتجر') . ' <onboarding@resend.dev>';
}
// بريد استلام الطلبات: الإيميل المخصص إن وُجد وإلا بريد التواصل
function notify_email_addr(): string {
    return setting('notify_email', '') ?: setting('email', '') ?: (defined('NOTIFY_EMAIL') ? (string)NOTIFY_EMAIL : '');
}
// إرسال عبر Resend — يرجع true فقط عند القبول، ولا يوقف الموقع أبداً
function resend_send(string $to, string $subject, string $html): bool {
    if(getenv('ISTORE_DISABLE_NOTIFICATIONS')==='1')return false;
    $key = mail_key();
    if (!$key || !$to) return false;
    $payload = json_encode(['from' => mail_from(), 'to' => [$to], 'subject' => $subject, 'html' => $html], JSON_UNESCAPED_UNICODE);
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $key, 'Content-Type: application/json'],
        CURLOPT_POSTFIELDS => $payload, CURLOPT_TIMEOUT => 8,
    ]);
    $resp = @curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($resp === false || $code >= 400) error_log('Resend send failed (' . $code . ') to ' . $to . ': ' . (string)$resp);
    curl_close($ch);
    return $resp !== false && $code >= 200 && $code < 300;
}
// قالب بريد موحد باسم المتجر
function mail_shell(string $title, string $bodyHtml): string {
    $store = e(setting('store_name', 'المتجر'));
    return '<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:560px;margin:auto;background:#f7f7f9;padding:28px;border-radius:16px">'
        . '<h1 style="margin:0 0 16px;font-size:20px">' . $store . '</h1>'
        . '<div style="background:#fff;border-radius:12px;padding:20px"><h2 style="margin:0 0 10px;font-size:17px">' . $title . '</h2>' . $bodyHtml . '</div>'
        . '<p style="color:#999;font-size:11px;margin-top:16px">' . $store . '</p></div>';
}
function mail_items_html(array $o): string {
    $h = '<table style="width:100%;border-collapse:collapse;font-size:14px">';
    foreach ($o['items'] as $it) {
        $h .= '<tr><td style="padding:4px 0;border-bottom:1px solid #eee">' . e($it['name']) . ' × ' . $it['qty'] . '</td>'
            . '<td style="padding:4px 0;border-bottom:1px solid #eee;text-align:left">' . e($it['price']) . '</td></tr>';
    }
    $h .= '</table><p style="font-weight:bold;margin:12px 0 0">الإجمالي: ' . e((string)$o['total']) . ' ' . e($o['currency'] ?? setting('currency', '')) . '</p>';
    return $h;
}
// تأكيد الطلب للزبون
function send_order_confirmation(string $to, array $o): bool {
    $body = '<p>شكراً لطلبك من <b>' . e(setting('store_name', 'المتجر')) . '</b> يا <b>' . e($o['customer']) . '</b>!</p>'
        . '<p>رقم طلبك: <b>' . e($o['code']) . '</b> — سنتواصل معك لتأكيد الطلب.</p>'
        . mail_items_html($o)
        . '<p style="color:#888;font-size:12px">طريقة الدفع: الدفع عند الاستلام.</p>';
    return resend_send($to, 'تأكيد طلبك ' . $o['code'], mail_shell('تم استلام طلبك ✅', $body));
}
// إشعار الزبون بتغير حالة طلبه
function send_order_status_email(string $to, array $o, string $status): bool {
    $body = '<p>مرحباً <b>' . e($o['customer']) . '</b>،</p>'
        . '<p>حالة طلبك <b>' . e($o['code']) . '</b> أصبحت: <b>' . e(order_status_label($status)) . '</b>.</p>'
        . mail_items_html($o);
    return resend_send($to, 'طلبك ' . $o['code'] . ' — ' . order_status_label($status), mail_shell('تحديث حالة طلبك', $body));
}

function notify_new_order(array $o): void {
    $to = notify_email_addr();
    if (!$to) return;
    $o['coupon_code'] = $o['coupon_code'] ?? ($o['couponCode'] ?? '');
    $o['delivery_fee'] = $o['delivery_fee'] ?? ($o['deliveryFee'] ?? 0);
    $lines = '';
    foreach ($o['items'] as $it) $lines .= '<li>' . e($it['name']) . ' × ' . $it['qty'] . ' — ' . e($it['price']) . '</li>';
    $coupon = $o['coupon_code'] ? '<p>كوبون: <b>' . e($o['coupon_code']) . '</b> (−' . e((string)$o['discount']) . ')</p>' : '';
    $body = '<p><b>' . e($o['customer']) . '</b> — <span dir="ltr">' . e($o['phone']) . '</span><br>' . e($o['city']) . ($o['address'] ? ' — ' . e($o['address']) : '') . '</p>'
        . ($o['notes'] ? '<p>ملاحظات الزبون: ' . e($o['notes']) . '</p>' : '')
        . '<ul>' . $lines . '</ul>'
        . '<p>المجموع: ' . e((string)$o['subtotal']) . ' — التوصيل: ' . e((string)$o['delivery_fee']) . $coupon . '</p>'
        . '<p style="font-weight:bold;font-size:16px">الإجمالي: ' . e((string)$o['total']) . ' ' . e($o['currency'] ?? setting('currency', '')) . '</p>';
    resend_send($to, '🛒 طلب جديد ' . $o['code'] . ' — ' . $o['total'] . ' ' . ($o['currency'] ?? setting('currency', '')), mail_shell('طلب جديد', $body));
}

// بريد "توفر مجدداً" لزبون سجّل بريده على منتج نافد (يعمل فقط إذا ضبطت المفتاح في config.php)
function send_stock_alert_email(string $to, string $productName, string $productUrl): bool {
    $body = '<p>المنتج <b>' . e($productName) . '</b> الذي سجلت اهتمامك به أصبح متوفراً الآن في المتجر.</p>'
        . '<p style="text-align:center;margin:20px 0"><a href="' . e($productUrl) . '" style="background:#0071e3;color:#fff;padding:12px 28px;border-radius:99px;text-decoration:none;font-weight:bold">اطلبه الآن</a></p>'
        . '<p style="color:#999;font-size:12px">الكمية محدودة — سارع بالطلب قبل نفادها.</p>';
    return resend_send($to, '✅ توفر مجدداً: ' . $productName, mail_shell('خبر سار 🎉', $body));
}

// عند عودة مخزون منتج من صفر: أرسل بريداً لكل مسجّل ببريد إلكتروني وعلّمه فقط.
// أرقام الهواتف تبقى "بانتظار" لتُشعَر يدوياً بواتساب من لوحة التحكم.
function notify_stock_restocked(int $productId, string $productName, string $slug): void {
    $waiting = qall("SELECT id, contact FROM stock_alerts WHERE product_id = ? AND notified = 0 AND contact LIKE '%@%'", [$productId]);
    if (!$waiting) return;
    $url = rtrim(setting('site_url', ''), '/') . url('product.php?slug=' . rawurlencode($slug));
    foreach ($waiting as $w) {
        if (send_stock_alert_email($w['contact'], $productName, $url)) {
            q('UPDATE stock_alerts SET notified = 1 WHERE id = ?', [(int)$w['id']]);
        }
    }
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
    $key=hash('sha256',$key);
    q('DELETE FROM login_attempts WHERE reset_at < NOW()');
    q('INSERT INTO login_attempts(k,cnt,reset_at) VALUES(?,1,?) ON DUPLICATE KEY UPDATE cnt=cnt+1',[$key,date('Y-m-d H:i:s',time()+$windowSec)]);
    return (int)(qone('SELECT cnt FROM login_attempts WHERE k=?',[$key])['cnt']??0)>$max;
}
function rate_reset(string $key): void {q('DELETE FROM login_attempts WHERE k=?',[hash('sha256',$key)]);}

function client_ip(): string {
    return substr($_SERVER['REMOTE_ADDR'] ?? 'local',0,100);
}

function safe_nav_url(string $value,string $fallback='#'):string {$s=trim($value);if(preg_match('/[\x00-\x20\\\\]/',$s))return $fallback;if(preg_match('#^/(?!/)#',$s)||preg_match('#^https?://#i',$s))return $s;return $fallback;}
