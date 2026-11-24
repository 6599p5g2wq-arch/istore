<?php
// القسم الافتتاحي: الإعدادات والقيم الافتراضية ومعالجة الشعار
const INTRO_ICON_LABELS = ['truck' => 'شحن', 'banknote' => 'دفع نقدي', 'zap' => 'سرعة', 'shield' => 'ضمان', 'gift' => 'هدية', 'percent' => 'خصم', 'clock' => 'وقت', 'star' => 'نجمة', 'phone' => 'هاتف', 'heart' => 'قلب'];

function intro_safe_link(string $v): string {
    $t = trim($v);
    if (preg_match('#^/(?!/)#', $t) || preg_match('#^https?://#i', $t)) return $t;
    return '/products.php';
}

function intro_cfg(): array {
    $s = settings();
    $cur = $s['currency'] ?? 'د.ل';
    $thr = (float)($s['free_shipping_threshold'] ?? 0);
    $chips = null;
    if (!empty($s['intro_chips'])) {
        $a = json_decode($s['intro_chips'], true);
        if (is_array($a)) {
            $chips = [];
            foreach ($a as $c) {
                $t = trim(mb_substr((string)($c['text'] ?? ''), 0, 40));
                if ($t === '') continue;
                $ic = (string)($c['icon'] ?? 'star');
                $chips[] = ['icon' => isset(INTRO_ICON_LABELS[$ic]) ? $ic : 'star', 'text' => $t];
                if (count($chips) >= 6) break;
            }
        }
    }
    if ($chips === null) {
        $chips = [];
        if ($thr > 0) $chips[] = ['icon' => 'truck', 'text' => 'شحن مجاني فوق ' . number_format($thr, 0, '.', ',') . ' ' . $cur];
        $chips[] = ['icon' => 'banknote', 'text' => 'الدفع عند الاستلام'];
        $chips[] = ['icon' => 'zap', 'text' => 'توصيل خلال 24-72 ساعة'];
        $chips[] = ['icon' => 'shield', 'text' => 'ضمان سنة'];
    }
    $op = $s['intro_logo_opacity'] ?? '';
    $op = ($op === '' || !is_numeric($op)) ? 18 : max(0, min(60, (float)$op));
    $tag = trim($s['intro_tagline'] ?? '');
    if ($tag === '') $tag = $s['store_tagline'] ?? '';
    return [
        'enabled' => ($s['intro_enabled'] ?? '1') !== '0',
        'title' => trim($s['intro_title'] ?? '') ?: ($s['store_name'] ?? 'آي ستور'),
        'pill' => array_key_exists('intro_pill', $s) ? mb_substr(trim($s['intro_pill']), 0, 40) : 'تشكيلة ' . date('Y') . ' الجديدة',
        'tagline' => $tag,
        'logo' => $s['intro_logo'] ?? '',
        'opacity' => $op,
        'chips' => $chips,
        'cta_text' => trim($s['intro_cta_text'] ?? '') ?: 'تسوق الآن',
        'cta_link' => intro_safe_link($s['intro_cta_link'] ?? '/products.php'),
    ];
}

function intro_delete_logo(): void {
    $old = setting('intro_logo', '');
    if ($old !== '' && preg_match('#^uploads/intro-logo-[A-Za-z0-9._-]+$#', $old)) {
        $p = APP_ROOT . '/' . $old;
        if (is_file($p)) @unlink($p);
    }
}

// يعيد [مسار|null, رسالة خطأ]. الصور تُصغَّر إلى 640px مع الحفاظ على الشفافية وتُغبَّش قليلاً وتُحفظ WebP/PNG.
function intro_save_logo(array $f): array {
    if (($f['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return [null, ''];
    if ($f['error'] !== UPLOAD_ERR_OK || $f['size'] > 5 * 1024 * 1024) return [null, 'تعذّر رفع الشعار (الحد الأقصى 5MB)'];
    $raw = file_get_contents($f['tmp_name']);
    $dir = APP_ROOT . '/uploads';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    $base = 'intro-logo-' . time() . '-' . bin2hex(random_bytes(3));
    // SVG: نرفضه إن احتوى سكربت أو أحداث أو مراجع خارجية، وإلا نحفظه كما هو
    if (stripos(ltrim($raw), '<') === 0 && stripos($raw, '<svg') !== false) {
        return [null, 'استخدم شعار PNG أو JPG أو WebP بدلاً من SVG'];
    }
    $info = @getimagesizefromstring($raw);
    if (!$info || $info[0]*$info[1]>40000000 || !in_array($info[2], [IMAGETYPE_PNG, IMAGETYPE_JPEG, IMAGETYPE_WEBP], true)) return [null, 'الصيغة غير مدعومة (PNG / JPG / WebP / SVG)'];
    $ext = $info[2] === IMAGETYPE_PNG ? 'png' : ($info[2] === IMAGETYPE_WEBP ? 'webp' : 'jpg');
    if (function_exists('imagecreatefromstring')) {
        $im = @imagecreatefromstring($raw);
        if ($im) {
            $w = imagesx($im); $h = imagesy($im);
            $sc = min(1, 640 / max($w, $h));
            $nw = max(1, (int)round($w * $sc)); $nh = max(1, (int)round($h * $sc));
            $out = imagecreatetruecolor($nw, $nh);
            imagealphablending($out, false); imagesavealpha($out, true);
            imagefill($out, 0, 0, imagecolorallocatealpha($out, 0, 0, 0, 127));
            imagecopyresampled($out, $im, 0, 0, 0, 0, $nw, $nh, $w, $h);
            if (defined('IMG_FILTER_GAUSSIAN_BLUR')) imagefilter($out, IMG_FILTER_GAUSSIAN_BLUR);
            if (function_exists('imagewebp')) { $rel = 'uploads/' . $base . '.webp'; $ok = @imagewebp($out, APP_ROOT . '/' . $rel, 82); }
            else { $rel = 'uploads/' . $base . '.png'; $ok = @imagepng($out, APP_ROOT . '/' . $rel, 6); }
            if ($ok) return [$rel, ''];
        }
    }
    $rel = 'uploads/' . $base . '.' . $ext;
    return file_put_contents(APP_ROOT . '/' . $rel, $raw) !== false ? [$rel, ''] : [null, 'تعذّر حفظ الشعار'];
}
