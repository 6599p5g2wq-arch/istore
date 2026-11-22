<?php
require_once dirname(__DIR__) . '/includes/bootstrap.php';
require_once APP_ROOT . '/includes/auth.php';
control_logout();
header('Location: ' . url('control/login.php'));
exit;
