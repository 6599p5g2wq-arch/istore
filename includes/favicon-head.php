<?php
$favLogo = (string)setting('intro_logo', '');
if ($favLogo !== ''):
    $favFile = APP_ROOT . '/' . ltrim($favLogo, '/');
    $fv = substr(hash('sha256', $favLogo . (is_file($favFile) ? hash_file('sha256', $favFile) : '')), 0, 16);
?>
<link rel="icon" type="image/x-icon" sizes="48x48" href="<?= e(url('favicon.php?ico=1&v=' . $fv)) ?>">
<link rel="icon" type="image/png" sizes="32x32" href="<?= e(url('favicon.php?s=32&v=' . $fv)) ?>">
<link rel="icon" type="image/png" sizes="192x192" href="<?= e(url('favicon.php?s=192&v=' . $fv)) ?>">
<link rel="shortcut icon" href="<?= e(url('favicon.php?ico=1&v=' . $fv)) ?>">
<link rel="apple-touch-icon" sizes="180x180" href="<?= e(url('favicon.php?s=180&v=' . $fv)) ?>">
<?php endif; ?>
