<?php
// GET إعدادات المتجر العلنية + المدن + شرائح الرئيسية + البنرات — نقطة إقلاع التطبيق
require_once __DIR__ . '/_api.php';
if (api_method() !== 'GET') api_fail('Method not allowed', 405);
$publicKeys = ['store_name', 'store_tagline', 'announcement', 'currency', 'footer_text', 'phone', 'whatsapp', 'email',
    'address', 'working_hours', 'facebook', 'instagram', 'tiktok', 'free_shipping_threshold',
    'about_text', 'delivery_policy', 'returns_policy'];
$all = settings();
$out = [];
foreach ($publicKeys as $k) $out[$k] = $all[$k] ?? '';
$out['whatsapp_number'] = preg_replace('/\D+/', '', $out['whatsapp']);
$cities = qall('SELECT name, fee FROM cities WHERE active = 1 ORDER BY sort_order, name');
$slides = qall('SELECT title, subtitle, cta_text, cta_link, image, theme FROM hero_slides WHERE active = 1 ORDER BY sort_order, id');
$banners = qall('SELECT title, subtitle, image, link FROM banners WHERE active = 1 ORDER BY sort_order, id');
api_ok([
    'settings' => $out,
    'cities' => array_map(fn($c) => ['name' => $c['name'], 'fee' => (float)$c['fee']], $cities),
    'hero_slides' => array_map(fn($s) => [
        'title' => $s['title'], 'subtitle' => $s['subtitle'], 'cta_text' => $s['cta_text'],
        'cta_link' => $s['cta_link'], 'image' => $s['image'] ? img_url($s['image']) : '', 'theme' => $s['theme'],
    ], $slides),
    'banners' => array_map(fn($b) => [
        'title' => $b['title'], 'subtitle' => $b['subtitle'],
        'image' => $b['image'] ? img_url($b['image']) : '', 'link' => $b['link'],
    ], $banners),
]);
