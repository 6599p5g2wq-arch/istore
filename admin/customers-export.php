<?php
require_once __DIR__ . '/_init.php';
require_admin();
// تصدير CSV بترميز UTF-8 مع BOM ليفتح بالعربية صحيحاً في Excel
$guests = ($_GET['tab'] ?? '') === 'guests';
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . ($guests ? 'guests' : 'customers') . '.csv"');
echo "\xEF\xBB\xBF";
$out = fopen('php://output', 'w');
if ($guests) {
    fputcsv($out, ['الاسم', 'الهاتف', 'عدد الطلبات', 'إجمالي المشتريات', 'آخر طلب']);
    foreach (qall("SELECT MAX(customer_name) n, phone, COUNT(*) c, SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END) t, MAX(created_at) l FROM orders WHERE customer_id IS NULL GROUP BY phone ORDER BY l DESC") as $r)
        fputcsv($out, [$r['n'], $r['phone'], $r['c'], $r['t'], $r['l']]);
} else {
    fputcsv($out, ['الاسم', 'الهاتف', 'البريد', 'تاريخ التسجيل', 'آخر دخول', 'الحالة', 'عدد الطلبات', 'إجمالي المشتريات', 'آخر طلب']);
    foreach (qall("SELECT c.name, c.phone, c.email, c.created_at, c.last_login, c.blocked, COUNT(o.id) oc, COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total END), 0) t, MAX(o.created_at) l
        FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id, c.name, c.phone, c.email, c.created_at, c.last_login, c.blocked ORDER BY c.id DESC") as $r)
        fputcsv($out, [$r['name'], $r['phone'], $r['email'], $r['created_at'], $r['last_login'] ?? '', $r['blocked'] ? 'موقوف' : 'نشط', $r['oc'], $r['t'], $r['l'] ?? '']);
}
fclose($out);
