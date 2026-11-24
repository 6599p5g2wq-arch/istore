<?php
// اتصال قاعدة البيانات (PDO MySQL)
function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    if (defined('DB_SOCKET') && DB_SOCKET !== '') {
        $dsn = 'mysql:unix_socket=' . DB_SOCKET . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    } else {
        $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    }
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    migrate_variants($pdo);
    migrate_customers($pdo);
    migrate_orders_admin($pdo);
    migrate_brands_description($pdo);
    return $pdo;
}

// ترقية الماركات: حقل الوصف. آمنة للتكرار
function migrate_brands_description(PDO $pdo): void {
    static $done = false;
    if ($done) return;
    $done = true;
    try { $pdo->exec("ALTER TABLE brands ADD COLUMN description TEXT NOT NULL DEFAULT '' AFTER slug"); } catch (PDOException $e) { /* العمود موجود مسبقاً */ }
}

// ترقية التقييمات: عمود رد المتجر. آمنة للتكرار
function migrate_reviews_reply(PDO $pdo): void {
    static $done = false;
    if ($done) return;
    $done = true;
    try { $pdo->exec("ALTER TABLE reviews ADD COLUMN reply TEXT NULL AFTER comment"); } catch (PDOException $e) { /* العمود موجود مسبقاً */ }
}

// ترقية الطلبات: ملاحظات الأدمن الداخلية + سجل الحالات. آمنة للتكرار
function migrate_orders_admin(PDO $pdo): void {
    static $done = false;
    if ($done) return;
    $done = true;
    foreach ([
        'ALTER TABLE orders ADD COLUMN admin_notes TEXT NULL',
        "ALTER TABLE orders ADD COLUMN email VARCHAR(200) NOT NULL DEFAULT ''",
        'CREATE TABLE IF NOT EXISTS order_status_log (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (order_id), FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
    ] as $sql) {
        try { $pdo->exec($sql); } catch (PDOException $e) { /* موجود مسبقاً */ }
    }
    // تعبئة السجل للطلبات الموجودة قبل إنشائه (حالتها الحالية بتاريخ إنشائها)
    try {
        $has = (int)$pdo->query('SELECT COUNT(*) c FROM order_status_log')->fetch()['c'];
        if ($has === 0) {
            $pdo->exec('INSERT INTO order_status_log (order_id, status, created_at) SELECT id, status, created_at FROM orders');
        }
    } catch (PDOException $e) { /* السجل معبأ مسبقاً */ }
}

// ترقية المتغيرات لقواعد بيانات قائمة: آمنة للتكرار
function migrate_variants(PDO $pdo): void {
    static $done = false;
    if ($done) return;
    $done = true;
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS product_variants (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, label VARCHAR(300) NOT NULL DEFAULT '', options TEXT NOT NULL, price DECIMAL(10,2) NULL, stock INT NOT NULL DEFAULT 0, image VARCHAR(500) NOT NULL DEFAULT '', sort_order INT NOT NULL DEFAULT 0, UNIQUE KEY uq_variant (product_id, label(120)), FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        foreach ([
            'ALTER TABLE products ADD COLUMN options TEXT NULL AFTER images',
            'ALTER TABLE order_items ADD COLUMN variant_id INT NULL AFTER qty',
            "ALTER TABLE order_items ADD COLUMN variant_label VARCHAR(300) NOT NULL DEFAULT '' AFTER variant_id",
            'ALTER TABLE api_cart ADD COLUMN variant_id INT NOT NULL DEFAULT 0 AFTER product_id',
            'ALTER TABLE api_cart DROP INDEX uq_cart',
            'ALTER TABLE api_cart ADD UNIQUE KEY uq_cart (customer_id, product_id, variant_id)',
        ] as $sql) {
            try { $pdo->exec($sql); } catch (PDOException $e) { /* عمود أو فهرس موجود */ }
        }
    } catch (PDOException $e) { /* تجاهل: قاعدة قديمة تُرقّى لاحقاً */ }
}

function q(string $sql, array $params = []): PDOStatement {
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function qall(string $sql, array $params = []): array {
    return q($sql, $params)->fetchAll();
}

function qone(string $sql, array $params = []) {
    $row = q($sql, $params)->fetch();
    return $row === false ? null : $row;
}

// ترقية حسابات الزبائن: إيقاف الحساب، آخر دخول، العنوان الافتراضي، وجدول محاولات الدخول. آمنة للتكرار
function migrate_customers(PDO $pdo): void {
    static $done = false;
    if ($done) return;
    $done = true;
    foreach ([
        'ALTER TABLE customers ADD COLUMN blocked TINYINT NOT NULL DEFAULT 0',
        'ALTER TABLE customers ADD COLUMN last_login DATETIME NULL',
        "ALTER TABLE customers ADD COLUMN city VARCHAR(100) NOT NULL DEFAULT ''",
        "ALTER TABLE customers ADD COLUMN address VARCHAR(300) NOT NULL DEFAULT ''",
        'ALTER TABLE customers ADD COLUMN must_change TINYINT NOT NULL DEFAULT 0',
        'ALTER TABLE customers ADD COLUMN points INT NOT NULL DEFAULT 0',
        'ALTER TABLE customers ADD COLUMN vip_override TINYINT NULL',
        'ALTER TABLE coupons ADD COLUMN max_uses INT NOT NULL DEFAULT 0',
        'ALTER TABLE coupons ADD COLUMN used_count INT NOT NULL DEFAULT 0',
        'ALTER TABLE coupons ADD COLUMN customer_id INT NULL',
        "ALTER TABLE coupons ADD COLUMN starts_at VARCHAR(40) NOT NULL DEFAULT ''",
        'ALTER TABLE orders ADD COLUMN points_used INT NOT NULL DEFAULT 0',
        'ALTER TABLE orders ADD COLUMN points_discount DECIMAL(10,2) NOT NULL DEFAULT 0',
        'ALTER TABLE orders ADD COLUMN points_awarded INT NOT NULL DEFAULT 0',
        'ALTER TABLE orders ADD COLUMN points_refunded TINYINT NOT NULL DEFAULT 0',
        'CREATE TABLE IF NOT EXISTS points_log (id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT NOT NULL, delta INT NOT NULL, reason VARCHAR(200) NOT NULL DEFAULT \'\', order_id INT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (customer_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
        'CREATE TABLE IF NOT EXISTS login_attempts (k VARCHAR(190) PRIMARY KEY, cnt INT NOT NULL DEFAULT 0, reset_at DATETIME NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
    ] as $sql) {
        try { $pdo->exec($sql); } catch (PDOException $e) { /* موجود مسبقاً */ }
    }
}
