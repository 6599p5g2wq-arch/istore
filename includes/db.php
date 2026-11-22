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
    return $pdo;
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
