<?php
// إشعار المالك بتيليجرام عند كل طلب جديد.
// إعدادات لوحة /control تتقدم على الثوابت في config.php.
// لا يفشل ولا يبطئ إتمام الطلب أبداً: أي خطأ يُبتلع.

function tg_config(): array {
    $token = setting('telegram_bot_token', '');
    if ($token === '' && defined('TELEGRAM_BOT_TOKEN')) $token = TELEGRAM_BOT_TOKEN;
    $chatId = setting('telegram_chat_id', '');
    if ($chatId === '' && defined('TELEGRAM_CHAT_ID')) $chatId = TELEGRAM_CHAT_ID;
    return [$token, $chatId];
}

function tg_send(string $text): bool {
    if(getenv('ISTORE_DISABLE_NOTIFICATIONS')==='1')return false;
    [$token, $chatId] = tg_config();
    if ($token === '' || $chatId === '') return false;
    try {
        $ch = curl_init('https://api.telegram.org/bot' . $token . '/sendMessage');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode(['chat_id' => $chatId, 'text' => $text, 'disable_web_page_preview' => true], JSON_UNESCAPED_UNICODE),
            CURLOPT_TIMEOUT => 5,
        ]);
        $res = @curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        return $res !== false && $code >= 200 && $code < 300;
    } catch (Throwable $e) {
        return false;
    }
}

function tg_order_alert(array $o): void {
    [$token, $chatId] = tg_config();
    if ($token === '' || $chatId === '') return;
    $lines = [];
    foreach ($o['items'] as $it) {
        $label = !empty($it['variant_label']) ? $it['name'] . ' — ' . $it['variant_label'] : $it['name'];
        $lines[] = '• ' . $label . ' × ' . $it['qty'] . ' — ' . format_price($it['price'] * $it['qty']);
    }
    $orderUrl = '';
    if (!empty($o['order_id'])) {
        $base = rtrim(setting('site_url', ''), '/');
        if ($base !== '') $orderUrl = $base . '/admin/order.php?id=' . (int)$o['order_id'];
    }
    $text = "🛒 طلب جديد: {$o['code']}\n"
        . "الزبون: {$o['customer']}\n"
        . "الهاتف: {$o['phone']}\n"
        . "المدينة: {$o['city']}\n"
        . implode("\n", $lines) . "\n"
        . 'الإجمالي: ' . format_price($o['total'])
        . ($orderUrl !== '' ? "\n" . $orderUrl : '');
    tg_send($text);
}
