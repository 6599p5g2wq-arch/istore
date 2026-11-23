<?php
// شريط المميزات المتحرك: إعداداته في لوحة الإدارة > الإعدادات
const MARQUEE_ICON_LABELS = ['truck' => 'شحن', 'banknote' => 'دفع نقدي', 'badge-check' => 'أصلي', 'settings' => 'استبدال', 'shield' => 'ضمان', 'bell' => 'دعم', 'zap' => 'سرعة', 'gift' => 'هدية', 'percent' => 'خصم', 'clock' => 'وقت', 'star' => 'نجمة', 'phone' => 'هاتف', 'heart' => 'قلب'];

function marquee_defaults(): array {
    return [
        ['icon' => 'truck', 'text' => 'توصيل لكل المدن الليبية'], ['icon' => 'banknote', 'text' => 'الدفع عند الاستلام'],
        ['icon' => 'badge-check', 'text' => 'منتجات أصلية 100%'], ['icon' => 'settings', 'text' => 'استبدال خلال 7 أيام'],
        ['icon' => 'shield', 'text' => 'ضمان على الأجهزة'], ['icon' => 'bell', 'text' => 'دعم على مدار الساعة'],
    ];
}

function marquee_clean($a, array $labels): array {
    $out = [];
    if (!is_array($a)) return $out;
    foreach ($a as $c) {
        $t = trim(mb_substr((string)($c['text'] ?? ''), 0, 40));
        if ($t === '') continue;
        $ic = (string)($c['icon'] ?? 'star');
        $out[] = ['icon' => isset($labels[$ic]) ? $ic : 'star', 'text' => $t];
        if (count($out) >= 6) break;
    }
    return $out;
}

function marquee_cfg(): array {
    $s = settings();
    $items = marquee_defaults();
    if (!empty($s['marquee_items'])) $items = marquee_clean(json_decode($s['marquee_items'], true), MARQUEE_ICON_LABELS);
    return ['enabled' => ($s['marquee_enabled'] ?? '1') !== '0' && count($items) > 0, 'items' => $items];
}
