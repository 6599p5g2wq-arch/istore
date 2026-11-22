<?php
// متغيرات المنتجات: خيارات حرة لكل منتج (مثال: الجهاز، اللون، المقاس) وتوليفاتها.

/** تفسير عمود products.options إلى قائمة خيارات نظيفة: [['name'=>..,'values'=>[..]], ..] */
function parse_options(?string $json): array {
    $a = json_decode($json ?: '[]', true);
    if (!is_array($a)) return [];
    $out = [];
    foreach ($a as $o) {
        $name = trim((string)($o['name'] ?? ''));
        $values = array_values(array_filter(array_map('trim', array_map('strval', (array)($o['values'] ?? [])))));
        if ($name !== '' && $values) $out[] = ['name' => $name, 'values' => $values];
        if (count($out) >= 3) break;
    }
    return $out;
}

/** كل توليفات الخيارات بترتيب ثابت: [['الجهاز'=>'16','اللون'=>'أسود'], ..] */
function option_combos(array $options): array {
    $acc = [[]];
    foreach ($options as $o) {
        $next = [];
        foreach ($acc as $base) foreach ($o['values'] as $v) $next[] = $base + [$o['name'] => $v];
        $acc = $next;
    }
    return $acc;
}

function combo_label(array $combo, array $options): string {
    $parts = [];
    foreach ($options as $o) if (isset($combo[$o['name']])) $parts[] = $combo[$o['name']];
    return implode(' / ', $parts);
}

function get_variants(int $productId): array {
    return qall('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order, id', [$productId]);
}

/**
 * تستبدل متغيرات المنتج من مدخلات الإدارة. التوليفات تُحسب من تعريف الخيارات،
 * ومدخلات المدير تزود السعر/المخزون/الصورة لكل توليفة. مخزون المنتج الكلي
 * يُزامَن مع مجموع مخزون المتغيرات ما دامت موجودة.
 */
function replace_variants(int $productId, string $optionsJson, array $inputs): void {
    $options = parse_options($optionsJson);
    q('DELETE FROM product_variants WHERE product_id = ?', [$productId]);
    if (!$options) return;
    $byLabel = [];
    foreach ($inputs as $inp) {
        if (!is_array($inp)) continue;
        $clean = [];
        foreach ($options as $o) {
            $v = trim((string)($inp['options'][$o['name']] ?? ''));
            if (in_array($v, $o['values'], true)) $clean[$o['name']] = $v;
        }
        $byLabel[combo_label($clean, $options)] = ['options' => $clean, 'price' => $inp['price'] ?? null, 'stock' => $inp['stock'] ?? 0, 'image' => $inp['image'] ?? ''];
    }
    $sort = 0;
    foreach (option_combos($options) as $combo) {
        $label = combo_label($combo, $options);
        $inp = $byLabel[$label] ?? null;
        $price = $inp && $inp['price'] !== null && $inp['price'] !== '' && (float)$inp['price'] > 0 ? (float)$inp['price'] : null;
        $stock = max(0, (int)($inp['stock'] ?? 0));
        $image = mb_substr((string)($inp['image'] ?? ''), 0, 500);
        q('INSERT INTO product_variants (product_id, label, options, price, stock, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [$productId, $label, json_encode($combo, JSON_UNESCAPED_UNICODE), $price, $stock, $image, $sort++]);
    }
    sync_product_stock($productId);
}

/** مخزون المنتج يعكس مجموع المتغيرات ما دام لها وجود. */
function sync_product_stock(int $productId): void {
    $row = qone('SELECT COUNT(*) AS n, COALESCE(SUM(stock), 0) AS s FROM product_variants WHERE product_id = ?', [$productId]);
    if ($row && (int)$row['n'] > 0) q('UPDATE products SET stock = ? WHERE id = ?', [(int)$row['s'], $productId]);
}
