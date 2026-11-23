<?php
// أيقونة المتصفح (PNG مربع شفاف) من الشعار المرفوع. الحجم: ?s=32|48|180|192
require __DIR__ . '/includes/bootstrap.php';
$s = (int)($_GET['s'] ?? 48);
if (!in_array($s, [16, 32, 48, 64, 180, 192, 512], true)) $s = 48;
$logo = (string)setting('intro_logo', '');
$file = $logo !== '' && !preg_match('#^https?://#', $logo) ? APP_ROOT . '/' . ltrim($logo, '/') : '';
if ($file === '' || !is_file($file) || !function_exists('imagecreatefromstring')) { http_response_code(404); exit; }
$im = @imagecreatefromstring((string)file_get_contents($file));
if (!$im) { http_response_code(404); exit; }
$w = imagesx($im); $h = imagesy($im);
$r = min($s / $w, $s / $h); $nw = max(1, (int)round($w * $r)); $nh = max(1, (int)round($h * $r));
$out = imagecreatetruecolor($s, $s);
imagealphablending($out, false); imagesavealpha($out, true);
imagefill($out, 0, 0, imagecolorallocatealpha($out, 0, 0, 0, 127));
imagealphablending($out, true);
imagecopyresampled($out, $im, (int)(($s - $nw) / 2), (int)(($s - $nh) / 2), 0, 0, $nw, $nh, $w, $h);
header('Content-Type: image/png');
header('Cache-Control: public, max-age=86400');
imagepng($out);
