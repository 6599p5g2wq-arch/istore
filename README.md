> راجع HOSTING-AR.md وRELEASE-NOTES.md أولاً. الحزمة جاهزة للاختبار على استضافتك بالشروط المذكورة، ولم يتم اختبار حساب الاستضافة الحقيقي.

# آي ستور — نسخة PHP + MySQL

متجر إلكتروني كامل (عربي RTL) يعمل على XAMPP وأي استضافة مشتركة عادية بدون أي اعتماديات.
نفس تصميم ومزايا النسخة الأصلية بالكامل: واجهة متجر، سلة، مفضلة، دفع عند الاستلام لـ 26 مدينة ليبية،
كوبونات، تقييمات موثقة، حسابات عملاء، إشعارات طلبات بالبريد (Resend)، لوحة تحكم كاملة،
ووحدة إعدادات مستقلة (/control) بدخول منفصل.

## المتطلبات
- بيئة محلية PHP 8+؛ للإنتاج إصدار PHP مدعوم ومحدث (يفضل 8.3/8.4/8.5)، راجع HOSTING-AR.md
- اتصال بالإنترنت لتحميل الخطوط ومكتبة Tailwind من CDN (نفس طريقة الموقع الأصلي)

## التشغيل على XAMPP (خطوة بخطوة)
1. انسخ مجلد المشروع كاملاً إلى `C:\xampp\htdocs\istore`
2. شغّل Apache و MySQL من لوحة XAMPP
3. افتح `http://localhost/phpmyadmin` وأنشئ قاعدة بيانات جديدة باسم `istore`
   (الترميز utf8mb4_general_ci)
4. اضبط بيانات القاعدة وكلمات مرور غير افتراضية. استورد install.sql من phpMyAdmin، أو فعّل INSTALL_ENABLED مؤقتاً وافتح install.php واضغط بدء التثبيت ثم عطّله واحذفه
5. افتح المتجر: `http://localhost/istore/`

بديل الخطوة 4: استورد ملف `install.sql` يدوياً من phpMyAdmin داخل قاعدة `istore`.

## الحسابات الافتراضية (من ملف config.php)
- لوحة التحكم `/admin`: المستخدم `admin` / كلمة المرور `admin123`
- وحدة الإعدادات `/control`: المستخدم `control` / كلمة المرور `control123`

غيّر كلمات المرور الافتراضية في `config.php` قبل التشغيل، وبعد أول دخول يمكنك تغيير كلمة مرور
المدير من صفحة «المشرفون» داخل لوحة التحكم. احذف `install.php` بعد التثبيت.

## الإعدادات (config.php)
كل ما تحتاج تعديله في ملف واحد:
- بيانات قاعدة البيانات (المضيف، المنفذ، الاسم، المستخدم، كلمة المرور)
- `RESEND_API_KEY` و `NOTIFY_EMAIL` لتفعيل إشعار بريدي عند كل طلب جديد
  (أنشئ مفتاحاً مجانياً من resend.com)
- بيانات دخول /admin و /control الافتراضية

## الرفع على استضافة مشتركة
1. ارفع كل الملفات إلى `public_html` (أو مجلد فرعي)
2. أنشئ قاعدة MySQL من لوحة الاستضافة وسجل بياناتها في `config.php`
3. استورد install.sql في قاعدة فارغة، أو فعّل المثبت مؤقتاً كما في HOSTING-AR.md، ثم عطله واحذف install.php وinstall.sql من الخادم
4. تأكد أن مجلد `uploads/` قابل للكتابة (755)

## بنية المشروع
- `index.php` الصفحة الرئيسية — `products.php`, `product.php`, `cart.php`, `wishlist.php`,
  `checkout.php`, `track.php`, `account.php`, `brands.php`, `about.php`
- `api/` نقاط JSON (الطلبات، الكوبونات، التقييمات، البحث، التنبيهات، الإحصائيات)
- `admin/` لوحة التحكم الكاملة (منتجات، طلبات، تصنيفات، ماركات، كوبونات، تقييمات،
  شرائح، بنرات، مدن وتوصيل، سلات مهجورة، إشعارات توفر، مشرفون)
- `control/` وحدة إعدادات الموقع المستقلة (هوية، تواصل، سوشيال، شحن، تتبع، من نحن)
- `includes/` الاتصال، المساعدات، المصادقة، الأيقونات، الهيدر/الفوتر
- `assets/` التصميم (CSS) والتفاعلات (JS)
- `images/` صور المنتجات — `uploads/` الصور المرفوعة من لوحة التحكم
- `install.sql` إنشاء الجداول + البيانات الأولية (30 منتجاً، 26 مدينة، تصنيفات، ماركات...)

## واجهة REST API (لتطبيق الموبايل) — api/v1
كل الردود JSON بصيغة `{ok: true, ...}` أو `{ok: false, error: "..."}`. المصادقة بترويسة
`Authorization: Bearer <token>` من تسجيل الدخول.

| النقطة | الطريقة | الوصف |
|---|---|---|
| `api/v1/settings.php` | GET | إقلاع التطبيق: الإعدادات العلنية + المدن + شرائح الرئيسية + البنرات |
| `api/v1/products.php` | GET | قائمة (بحث/تصنيف/ماركة/عروض/سعر/فرز/صفحات) أو منتج واحد بـ `?slug=` |
| `api/v1/categories.php` | GET | التصنيفات مع عدد المنتجات |
| `api/v1/brands.php` | GET | الماركات مع عدد المنتجات |
| `api/v1/auth.php?action=register` | POST | حساب جديد `{name,email,phone,password}` → `token` |
| `api/v1/auth.php?action=login` | POST | دخول `{email,password}` → `token` |
| `api/v1/auth.php?action=logout` | POST | إلغاء التوكن الحالي |
| `api/v1/cart.php` | GET/POST/PUT/DELETE | سلة الحساب على الخادم (توكن) |
| `api/v1/wishlist.php` | GET/POST/DELETE | مفضلة الحساب (توكن) |
| `api/v1/orders.php` | POST | إنشاء طلب `{name,phone,city,address,notes,coupon,items:[{id,qty}]}` |
| `api/v1/orders.php` | GET | طلبات الحساب (توكن) أو تتبع زائر بـ `?code=&phone=` |
| `api/v1/coupons.php` | POST | تحقق من كوبون `{code, subtotal}` |
| `api/v1/reviews.php` | GET/POST | تقييمات منتج `?product_id=` / تقييم موثق برقم طلب مسلّم |
| `api/v1/account.php` | GET/PUT | الملف الشخصي وتعديله وتغيير كلمة المرور (توكن) |
| `api/v1/stock-alerts.php` | POST | تنبيه توفر منتج `{product_id, contact}` |

الجداول الجديدة (api_tokens, api_cart, api_wishlist) تُنشأ تلقائياً من install.sql/install.php —
لا حاجة لأي خطوة إضافية، والموقع يعمل كما هو تماماً.
