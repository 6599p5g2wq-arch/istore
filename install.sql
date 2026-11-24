
SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS settings (`key` VARCHAR(100) PRIMARY KEY, value TEXT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS categories (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(200) NOT NULL, slug VARCHAR(200) NOT NULL UNIQUE, description TEXT NOT NULL, image VARCHAR(500) NOT NULL DEFAULT '', sort_order INT NOT NULL DEFAULT 0, active TINYINT NOT NULL DEFAULT 1) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS brands (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(200) NOT NULL, slug VARCHAR(200) NOT NULL UNIQUE, description TEXT NOT NULL, image VARCHAR(500) NOT NULL DEFAULT '', sort_order INT NOT NULL DEFAULT 0, active TINYINT NOT NULL DEFAULT 1) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(300) NOT NULL, slug VARCHAR(300) NOT NULL UNIQUE, category_id INT NULL, brand_id INT NULL, description MEDIUMTEXT NOT NULL, price DECIMAL(10,2) NOT NULL DEFAULT 0, old_price DECIMAL(10,2) NULL, stock INT NOT NULL DEFAULT 0, image VARCHAR(500) NOT NULL DEFAULT '', images TEXT NOT NULL, options TEXT NULL, badge VARCHAR(100) NOT NULL DEFAULT '', featured TINYINT NOT NULL DEFAULT 0, active TINYINT NOT NULL DEFAULT 1, rating DECIMAL(2,1) NOT NULL DEFAULT 4.8, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (category_id), INDEX (brand_id), FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL, FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(40) NOT NULL UNIQUE, customer_name VARCHAR(200) NOT NULL, phone VARCHAR(60) NOT NULL, city VARCHAR(120) NOT NULL, address TEXT NOT NULL, notes TEXT NOT NULL, subtotal DECIMAL(10,2) NOT NULL DEFAULT 0, delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0, discount DECIMAL(10,2) NOT NULL DEFAULT 0, coupon_code VARCHAR(60) NOT NULL DEFAULT '', total DECIMAL(10,2) NOT NULL DEFAULT 0, status VARCHAR(20) NOT NULL DEFAULT 'new', customer_id INT NULL, admin_notes TEXT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (status), INDEX (created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS order_status_log (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (order_id), FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS product_variants (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, label VARCHAR(300) NOT NULL DEFAULT '', options TEXT NOT NULL, price DECIMAL(10,2) NULL, stock INT NOT NULL DEFAULT 0, image VARCHAR(500) NOT NULL DEFAULT '', sort_order INT NOT NULL DEFAULT 0, UNIQUE KEY uq_variant (product_id, label(120)), FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS order_items (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, product_id INT NULL, name VARCHAR(300) NOT NULL, price DECIMAL(10,2) NOT NULL, qty INT NOT NULL DEFAULT 1, variant_id INT NULL, variant_label VARCHAR(300) NOT NULL DEFAULT '', FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS cities (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL UNIQUE, fee DECIMAL(10,2) NOT NULL DEFAULT 0, active TINYINT NOT NULL DEFAULT 1, sort_order INT NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS hero_slides (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(300) NOT NULL DEFAULT '', subtitle TEXT NOT NULL, cta_text VARCHAR(100) NOT NULL DEFAULT 'تسوق الآن', cta_link VARCHAR(300) NOT NULL DEFAULT '/products.php', image VARCHAR(500) NOT NULL DEFAULT '', theme VARCHAR(10) NOT NULL DEFAULT 'dark', sort_order INT NOT NULL DEFAULT 0, active TINYINT NOT NULL DEFAULT 1) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS banners (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(300) NOT NULL DEFAULT '', subtitle TEXT NOT NULL, image VARCHAR(500) NOT NULL DEFAULT '', link VARCHAR(300) NOT NULL DEFAULT '/products.php', sort_order INT NOT NULL DEFAULT 0, active TINYINT NOT NULL DEFAULT 1) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS admin_users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(100) NOT NULL UNIQUE, pass_hash VARCHAR(255) NOT NULL, salt VARCHAR(64) NOT NULL DEFAULT '', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS sessions (token VARCHAR(128) PRIMARY KEY, admin_id INT NOT NULL, expires_at DATETIME NOT NULL, FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS control_users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(100) NOT NULL UNIQUE, pass_hash VARCHAR(255) NOT NULL, salt VARCHAR(64) NOT NULL DEFAULT '', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS control_sessions (token VARCHAR(128) PRIMARY KEY, control_id INT NOT NULL, expires_at DATETIME NOT NULL, FOREIGN KEY (control_id) REFERENCES control_users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS coupons (id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(60) NOT NULL UNIQUE, kind VARCHAR(20) NOT NULL DEFAULT 'percent', value DECIMAL(10,2) NOT NULL DEFAULT 0, min_total DECIMAL(10,2) NOT NULL DEFAULT 0, active TINYINT NOT NULL DEFAULT 1, expires_at VARCHAR(40) NOT NULL DEFAULT '', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS stock_alerts (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, contact VARCHAR(200) NOT NULL, notified TINYINT NOT NULL DEFAULT 0, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_alert (product_id, contact), FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS reviews (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, customer_name VARCHAR(200) NOT NULL, rating INT NOT NULL DEFAULT 5, comment TEXT NOT NULL, phone VARCHAR(60) NOT NULL, order_code VARCHAR(40) NOT NULL, approved TINYINT NOT NULL DEFAULT 0, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS cart_leads (id INT AUTO_INCREMENT PRIMARY KEY, phone VARCHAR(60) NOT NULL UNIQUE, items TEXT NOT NULL, total DECIMAL(10,2) NOT NULL DEFAULT 0, reminded TINYINT NOT NULL DEFAULT 0, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS page_views (id INT AUTO_INCREMENT PRIMARY KEY, path VARCHAR(500) NOT NULL, referrer VARCHAR(500) NOT NULL DEFAULT '', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS customers (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(200) NOT NULL, email VARCHAR(200) NOT NULL UNIQUE, phone VARCHAR(60) NOT NULL DEFAULT '', pass_hash VARCHAR(255) NOT NULL, salt VARCHAR(64) NOT NULL DEFAULT '', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, blocked TINYINT NOT NULL DEFAULT 0, last_login DATETIME NULL, city VARCHAR(100) NOT NULL DEFAULT '', address VARCHAR(300) NOT NULL DEFAULT '', must_change TINYINT NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS login_attempts (k VARCHAR(190) PRIMARY KEY, cnt INT NOT NULL DEFAULT 0, reset_at DATETIME NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS customer_sessions (token VARCHAR(128) PRIMARY KEY, customer_id INT NOT NULL, expires_at DATETIME NOT NULL, FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS api_tokens (token VARCHAR(128) PRIMARY KEY, customer_id INT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, expires_at DATETIME NOT NULL, FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS api_cart (id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT NOT NULL, product_id INT NOT NULL, variant_id INT NOT NULL DEFAULT 0, qty INT NOT NULL DEFAULT 1, UNIQUE KEY uq_cart (customer_id, product_id, variant_id), FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS api_wishlist (id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT NOT NULL, product_id INT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_wish (customer_id, product_id), FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


INSERT INTO `settings` (`key`,`value`) VALUES
('store_name','آي ستور'),
('site_url','https://istore-vzrb.onrender.com'),
('store_tagline','وجهتك الأولى لإكسسوارات ومنتجات Apple الأصلية في ليبيا'),
('announcement','توصيل سريع لكل المدن الليبية — الدفع عند الاستلام'),
('currency','د.ل'),
('phone','+218910000000'),
('whatsapp','218910000000'),
('email','info@istore.ly'),
('address','طرابلس، ليبيا'),
('working_hours','السبت - الخميس: 10 صباحاً - 10 مساءً'),
('about_text','آي ستور متجر ليبي متخصص في إكسسوارات ومنتجات Apple الأصلية. نستورد منتجاتنا من مصادر موثوقة ونوفرها لك بأفضل الأسعار مع ضمان الجودة وخدمة توصيل تغطي كل المدن الليبية.'),
('returns_policy','يمكنك استبدال أو استرجاع المنتج خلال 7 أيام من الاستلام بحالته الأصلية، بشرط عدم فتح المنتجات المغلقة بالشعار الأصلي. عيوب المصنع مشمولة بالضمان.'),
('delivery_policy','نوصل لكل المدن الليبية خلال 24-72 ساعة حسب المدينة. الدفع عند الاستلام متاح لجميع الطلبات.'),
('facebook','https://facebook.com'),
('instagram','https://instagram.com'),
('tiktok','https://tiktok.com'),
('footer_text','جميع الحقوق محفوظة'),
('free_shipping_threshold','500');

INSERT INTO `categories` (`id`,`name`,`slug`,`description`,`image`,`sort_order`,`active`) VALUES
(1,'أغطية وحماية','cases','أغطية أصلية وعصرية لحماية آيفونك بأناقة','/images/cat-cases.jpg',1,1),
(2,'شواحن وكابلات','chargers','شواحن سريعة وكابلات أصلية معتمدة','/images/cat-chargers.jpg',2,1),
(3,'السماعات','audio','AirPods وسماعات Apple الأصلية','/images/cat-audio.jpg',3,1),
(4,'Apple Watch وسوارات','watch','ساعات Apple وسوارات بكل الألوان والخامات','/images/cat-watch.jpg',4,1),
(5,'MagSafe','magsafe','إكسسوارات MagSafe المغناطيسية الأصلية','/images/cat-magsafe.jpg',5,1),
(6,'حماية الشاشة','protection','زجاج حماية وأفلام شاشة بجودة عالية','/images/cat-protection.jpg',6,1),
(7,'أجهزة Apple','devices','iPhone وiPad وMacBook وأجهزة Apple الأصلية','/images/cat-devices.jpg',7,1);

INSERT INTO `brands` (`id`,`name`,`slug`,`description`,`image`,`sort_order`,`active`) VALUES
(1,'Apple','apple','','',1,1),
(2,'Anker','anker','','',2,1),
(3,'Belkin','belkin','','',3,1),
(4,'Baseus','baseus','','',4,1);

INSERT INTO `products` (`id`,`name`,`slug`,`category_id`,`description`,`price`,`old_price`,`stock`,`image`,`images`,`badge`,`featured`,`active`,`rating`,`created_at`,`brand_id`) VALUES
(1,'غطاء iPhone 16 Pro Max سيليكون أصلي MagSafe','iphone-16-pro-max-silicone-case',1,'غطاء سيليكون أصلي من Apple مع دعم MagSafe كامل، بطانة مايكروفايبر ناعمة تحمي جهازك من الخدوش، وحواف مرتفعة لحماية الشاشة والكاميرا.',245,290,25,'/images/p-silicone-case.jpg','[]','الأكثر مبيعاً',1,1,4.9,'2026-11-22 10:40:47',1),
(2,'غطاء iPhone 16 شفاف MagSafe أصلي','iphone-16-clear-case',1,'غطاء شفاف رفيع من Apple يظهر تصميم جهازك الأصلي، مقاوم للاصفرار، مغناطيس MagSafe مدمج قوي.',225,NULL,30,'/images/p-clear-case.jpg','[]','',0,1,4.8,'2026-11-22 10:40:47',1),
(3,'غطاء جلد طبيعي فاخر iPhone 15 Pro','leather-case-15-pro',1,'غطاء جلد طبيعي فاخر بملمس راقي، حماية كاملة للزوايا، متوفر بعدة ألوان كلاسيكية.',320,380,12,'/images/p-leather-case.jpg','[]','خصم',1,1,4.7,'2026-11-22 10:40:47',1),
(4,'غطاء حماية عسكري مضاد للصدمات iPhone 16','armor-case-16',1,'حماية بمعيار عسكري MIL-STD، طبقتان ماصتان للصدمات، مسند خلفي مدمج، حماية سقوط حتى 3 أمتار.',145,NULL,40,'/images/p-armor-case.jpg','[]','',0,1,5,'2026-11-22 10:40:47',1),
(5,'شاحن Apple أصلي 20W USB-C','apple-20w-charger',2,'محول طاقة Apple الأصلي بقوة 20W، يشحن آيفونك حتى 50% في 30 دقيقة، متوافق مع كل أجهزة USB-C.',165,195,50,'/images/p-20w-charger.jpg','[]','الأكثر مبيعاً',1,1,4.6,'2026-11-22 10:40:47',1),
(6,'كابل Apple أصلي USB-C إلى USB-C مترين','usbc-cable-2m',2,'كابل شحن Apple الأصلي بطول مترين، يدعم الشحن السريع ونقل البيانات، خامة مضفرة متينة.',145,NULL,45,'/images/p-usbc-cable.jpg','[]','',0,1,4.9,'2026-11-22 10:40:47',1),
(7,'شاحن سيارة مزدوج 48W PD سريع','car-charger-48w',2,'شاحن سيارة بمنفذين USB-C وUSB-A بقوة 48W، شحن سريع PD لآيفونك أثناء القيادة.',95,120,35,'/images/p-car-charger.jpg','[]','خصم',0,1,4.8,'2026-11-22 10:40:47',1),
(8,'باور بانك MagSafe مغناطيسي 10000mAh','magsafe-powerbank',2,'باور بانك مغناطيسي يلتصق بظهر آيفونك، سعة 10000mAh، شحن لاسلكي 15W وسلكي 20W، شاشة رقمية للبطارية.',285,340,18,'/images/p-magsafe-powerbank.jpg','[]','جديد',1,1,4.7,'2026-11-22 10:40:47',1),
(9,'AirPods Pro 2 USB-C أصلية','airpods-pro-2',3,'سماعات AirPods Pro الجيل الثاني بمنفذ USB-C، عزل ضوضاء نشط أقوى مرتين، صوت مكاني مخصص، مقاومة للماء والعرق IP54.',1580,1750,10,'/images/p-airpods-pro.jpg','[]','الأكثر مبيعاً',1,1,5,'2026-11-22 10:40:47',1),
(10,'AirPods 4 مع عزل الضوضاء النشط','airpods-4-anc',3,'أحدث سماعات Apple بتصميم مريح جديد، عزل ضوضاء نشط، صوت محسّن، علبة شحن USB-C لاسلكية.',1150,NULL,14,'/images/p-airpods-4.jpg','[]','جديد',1,1,4.6,'2026-11-22 10:40:47',1),
(11,'AirPods Max أصلية','airpods-max',3,'سماعات رأس فاخرة من Apple، عزل ضوضاء احترافي، صوت مكاني مع تتبع الرأس، 20 ساعة تشغيل، تصميم ألمنيوم فاخر.',3900,4200,4,'/images/p-airpods-max.jpg','[]','',1,1,4.9,'2026-11-22 10:40:47',1),
(12,'EarPods بمنفذ USB-C أصلية','earpods-usbc',3,'سماعات Apple السلكية الأصلية بمنفذ USB-C، صوت واضح ومايكروفون مدمج، متوافقة مع آيفون 15 وما بعده.',145,NULL,60,'/images/p-earpods.jpg','[]','',0,1,4.8,'2026-11-22 10:40:47',1),
(13,'Apple Watch Series 10 GPS 46mm','apple-watch-10-46',4,'أحدث ساعة Apple بشاشة أكبر وأرفع تصميم، تتبع صحي متقدم، مقاومة للماء 50 متر، شحن أسرع 30%.',3450,NULL,6,'/images/p-watch-10.jpg','[]','جديد',1,1,4.7,'2026-11-22 10:40:47',1),
(14,'Apple Watch SE 2024 GPS 44mm','apple-watch-se-44',4,'ساعة Apple الذكية بأفضل قيمة، تتبع رياضي وصحي شامل، إشعارات ومكالمات، مقاومة للماء.',1890,2100,8,'/images/p-watch-se.jpg','[]','خصم',1,1,5,'2026-11-22 10:40:47',1),
(15,'سوار Apple Watch رياضي سيليكون أصلي','watch-sport-band',4,'سوار رياضي أصلي من فلوروإيلاستمر الناعم، مريح ومتين، متوفر بألوان متعددة ومقاسات 42-46mm.',165,NULL,40,'/images/p-sport-band.jpg','[]','',0,1,4.6,'2026-11-22 10:40:47',1),
(16,'سوار Apple Watch ميلانيز ستانلس ستيل','watch-milanese-loop',4,'سوار ميلانيز من الستانلس ستيل المنسوج بإغلاق مغناطيسي، مظهر فاخر يناسب المناسبات الرسمية.',240,285,15,'/images/p-milanese.jpg','[]','',0,1,4.9,'2026-11-22 10:40:47',1),
(17,'شاحن MagSafe لاسلكي أصلي 15W','magsafe-charger',5,'شاحن MagSafe اللاسلكي الأصلي من Apple بقوة 15W، محاذاة مغناطيسية مثالية، كابل متر مدمج.',265,310,22,'/images/p-magsafe-charger.jpg','[]','الأكثر مبيعاً',1,1,4.8,'2026-11-22 10:40:47',1),
(18,'محفظة جلد MagSafe أصلية مع Find My','magsafe-wallet',5,'محفظة جلدية أنيقة تلتصق مغناطيسياً بظهر آيفونك، تتسع لثلاث بطاقات، تدعم تتبع Find My عند انفصالها.',385,NULL,9,'/images/p-magsafe-wallet.jpg','[]','',0,1,4.7,'2026-11-22 10:40:47',1),
(19,'حامل MagSafe للسيارة مغناطيسي قوي','magsafe-car-mount',5,'حامل سيارة مغناطيسي ثابت على التكييف، دوران 360 درجة، مغناطيس N52 قوي يثبت جهازك حتى على الطرق الوعرة.',85,110,30,'/images/p-car-mount.jpg','[]','خصم',0,1,5,'2026-11-22 10:40:47',1),
(20,'قاعدة شحن 3 في 1 MagSafe قابلة للطي','3in1-charging-station',5,'قاعدة شحن واحدة لآيفون وساعة Apple وسماعات AirPods معاً، تصميم قابل للطي مثالي للسفر، شحن سريع 15W.',340,420,16,'/images/p-3in1-station.jpg','[]','الأكثر مبيعاً',1,1,4.6,'2026-11-22 10:40:47',1),
(21,'زجاج حماية 9H شفاف iPhone 16 Pro Max','glass-16-pro-max',6,'زجاج حماية بصلابة 9H مقاوم للخدش والكسر، شفافية 99.9% لا تؤثر على اللمس أو جودة الشاشة، تركيب سهل بدون فقاعات.',55,75,80,'/images/p-glass.jpg','[]','',0,1,4.9,'2026-11-22 10:40:47',1),
(22,'زجاج حماية خصوصية iPhone 16','privacy-glass-16',6,'زجاج حماية بخاصية الخصوصية يمنع المتطفلين من رؤية شاشتك من الجوانب، صلابة 9H وطبقة ضد البصمات.',75,NULL,55,'/images/p-privacy-glass.jpg','[]','',0,1,4.8,'2026-11-22 10:40:47',1),
(23,'واقي عدسات الكاميرا iPhone 16 Pro','camera-lens-protector',6,'حلقات حماية فردية لعدسات الكاميرا من زجاج الياقوت، تحمي من الخدوش بدون التأثير على جودة التصوير.',65,85,45,'/images/p-lens.jpg','[]','خصم',0,1,4.7,'2026-11-22 10:40:47',1),
(24,'iPhone 16 Pro Max 256GB','iphone-16-pro-max-256',7,'أقوى آيفون على الإطلاق: شريحة A18 Pro، كاميرا 48MP مع زوم بصري 5x، هيكل تيتانيوم، زر التحكم بالكاميرا الجديد. ضمان سنة.',9850,NULL,5,'/images/p-iphone-16pm.jpg','[]','جديد',1,1,5,'2026-11-22 10:40:47',1),
(25,'iPhone 16 128GB','iphone-16-128',7,'آيفون 16 بشريحة A18 وكاميرا مزدوجة 48MP وزر Action وDynamic Island. الأداء الاحترافي بالسعر الأذكى. ضمان سنة.',7450,7900,7,'/images/p-iphone-16.jpg','[]','خصم',1,1,4.6,'2026-11-22 10:40:47',1),
(26,'iPad Air M2 11 بوصة 128GB WiFi','ipad-air-m2',7,'آيباد Air بشريحة M2 الخارقة، شاشة Liquid Retina 11 بوصة، يدعم Apple Pencil Pro وMagic Keyboard. مثالي للعمل والدراسة.',5250,NULL,4,'/images/p-ipad-air.jpg','[]','',1,1,4.9,'2026-11-22 10:40:47',1),
(27,'MacBook Air M3 13 بوصة 8GB/256GB','macbook-air-m3',7,'أرفع وأخف لابتوب من Apple بشريحة M3، بطارية 18 ساعة، شاشة Liquid Retina مذهلة، تصميم صامت بدون مروحة.',8900,9500,3,'/images/p-macbook-air.jpg','[]','خصم',1,1,4.8,'2026-11-22 10:40:47',1),
(28,'AirTag قطعة واحدة','airtag-1',7,'لا تضيع أغراضك بعد اليوم: AirTag يتتبع مفاتيحك وشنطك ومحفظتك بدقة عبر شبكة Find My العالمية، بطارية تدوم سنة.',285,330,25,'/images/p-airtag.jpg','[]','الأكثر مبيعاً',1,1,4.7,'2026-11-22 10:40:47',1),
(29,'Apple Pencil Pro','apple-pencil-pro',7,'قلم Apple الأحدث بمستشعر ضغط ودوران جديد، لمس haptic، إقران وشحن مغناطيسي. متوافق مع iPad Pro M4 وiPad Air M2.',950,NULL,8,'/images/p-pencil.jpg','[]','',0,1,5,'2026-11-22 10:40:47',1),
(30,'HomePod mini','homepod-mini',7,'مكبر صوت ذكي بحجم صغير وصوت يملأ الغرفة، مساعد Siri مدمج، تحكم بالمنزل الذكي، تصميم أنيق بألوان رائعة.',850,920,6,'/images/p-homepod.jpg','[]','',0,1,4.6,'2026-11-22 10:40:47',1);

INSERT INTO `cities` (`id`,`name`,`fee`,`active`,`sort_order`) VALUES
(1,'طرابلس',10,1,1),
(2,'تاجوراء',15,1,2),
(3,'جنزور',15,1,3),
(4,'الزاوية',15,1,4),
(5,'صرمان',20,1,5),
(6,'صبراتة',20,1,6),
(7,'الخمس',15,1,7),
(8,'زليتن',20,1,8),
(9,'مصراتة',20,1,9),
(10,'ترهونة',20,1,10),
(11,'بني وليد',25,1,11),
(12,'غريان',20,1,12),
(13,'الزنتان',25,1,13),
(14,'سبها',40,1,14),
(15,'سرت',30,1,15),
(16,'أجدابيا',30,1,16),
(17,'البريقة',35,1,17),
(18,'بنغازي',25,1,18),
(19,'المرج',30,1,19),
(20,'البيضاء',30,1,20),
(21,'درنة',35,1,21),
(22,'طبرق',40,1,22),
(23,'الكفرة',50,1,23),
(24,'مرزق',50,1,24),
(25,'أوباري',50,1,25),
(26,'زوارة',25,1,26);

INSERT INTO `hero_slides` (`id`,`title`,`subtitle`,`cta_text`,`cta_link`,`image`,`theme`,`sort_order`,`active`) VALUES
(1,'iPhone 16 Pro Max\nوصل حديثاً','شريحة A18 Pro وتصميم التيتانيوم — اقتنِه الآن مع ضمان سنة كاملة','اكتشف الآن','product.php?slug=iphone-16-pro-max-256','/images/hero-1.jpg','dark',1,1),
(2,'AirPods Pro 2\nصوت يفوق الخيال','عزل ضوضاء نشط أقوى مرتين وصوت مكاني مخصص لك','تسوق السماعات','product.php?slug=airpods-pro-2','/images/hero-2.jpg','dark',2,1),
(3,'كل إكسسوارات Apple الأصلية\nفي مكان واحد','شواحن، أغطية، ساعات وأكثر — توصيل سريع لباب بيتك والدفع عند الاستلام','تصفح المتجر','products.php','/images/hero-3.jpg','dark',3,1);

INSERT INTO `banners` (`id`,`title`,`subtitle`,`image`,`link`,`sort_order`,`active`) VALUES
(1,'شحن مجاني','للطلبات فوق 500 د.ل','','products.php',1,1),
(2,'منتجات أصلية 100%','مع ضمان الاستبدال خلال 7 أيام','','products.php',2,1);
