<?php
require_once __DIR__ . '/_init.php';
require_admin();
$id = (int)($_GET['id'] ?? 0);
$p = $id ? qone('SELECT * FROM products WHERE id = ?', [$id]) : null;
if ($id && !$p) { flash('المنتج غير موجود', true); redirect_admin('products.php'); }

function slugify_ar(string $name): string {
    $s = preg_replace('/[^\p{L}\p{N}]+/u', '-', trim($name));
    $s = trim($s, '-');
    return $s !== '' ? mb_strtolower($s) : 'product-' . substr(bin2hex(random_bytes(3)), 0, 6);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = mb_substr(trim($_POST['name'] ?? ''), 0, 300);
    $slug = trim($_POST['slug'] ?? '') ?: slugify_ar($name);
    $categoryId = (int)($_POST['category_id'] ?? 0) ?: null;
    $brandId = (int)($_POST['brand_id'] ?? 0) ?: null;
    $price = max(0, (float)($_POST['price'] ?? 0));
    $oldPrice = ($_POST['old_price'] ?? '') !== '' ? max(0, (float)$_POST['old_price']) : null;
    $stock = max(0, (int)($_POST['stock'] ?? 0));
    $badge = mb_substr(trim($_POST['badge'] ?? ''), 0, 100);
    $description = trim($_POST['description'] ?? '');
    $featured = !empty($_POST['featured']) ? 1 : 0;
    $active = !empty($_POST['active']) ? 1 : 0;
    $image = trim($_POST['image'] ?? '');
    $uploaded = handle_image_upload('image_file');
    if ($uploaded) $image = $uploaded;
    $images = array_values(array_filter(array_map('trim', explode("\n", $_POST['images'] ?? ''))));
    if (!$name || $price <= 0) {
        flash('الاسم والسعر مطلوبان', true);
    } else {
        // تأكد من فرادة الرابط
        $dup = qone('SELECT id FROM products WHERE slug = ? AND id != ?', [$slug, $id]);
        if ($dup) $slug .= '-' . substr(bin2hex(random_bytes(2)), 0, 4);
        if ($p) {
            q('UPDATE products SET name=?, slug=?, category_id=?, brand_id=?, description=?, price=?, old_price=?, stock=?, image=?, images=?, badge=?, featured=?, active=? WHERE id=?',
              [$name, $slug, $categoryId, $brandId, $description, $price, $oldPrice, $stock, $image, json_encode($images, JSON_UNESCAPED_UNICODE), $badge, $featured, $active, $id]);
            flash('تم حفظ التعديلات');
        } else {
            q('INSERT INTO products (name, slug, category_id, brand_id, description, price, old_price, stock, image, images, badge, featured, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [$name, $slug, $categoryId, $brandId, $description, $price, $oldPrice, $stock, $image, json_encode($images, JSON_UNESCAPED_UNICODE), $badge, $featured, $active]);
            flash('تمت إضافة المنتج');
        }
        redirect_admin('products.php');
    }
}
$cats = qall('SELECT id, name FROM categories ORDER BY sort_order, name');
$brands = qall('SELECT id, name FROM brands ORDER BY sort_order, name');
$imagesText = $p ? implode("\n", json_decode($p['images'] ?: '[]', true) ?: []) : '';
admin_header($p ? 'تعديل منتج' : 'منتج جديد', 'products.php');
?>
<div class="flex items-center justify-between">
  <h1 class="text-2xl font-black sm:text-3xl"><?= $p ? 'تعديل: ' . e($p['name']) : 'منتج جديد' ?></h1>
  <a href="<?= e(admin_url('products.php')) ?>" class="admin-btn-ghost"><?= icon('arrow-left', 16) ?> رجوع</a>
</div>
<?php admin_msg(); ?>
<form method="post" enctype="multipart/form-data" class="mt-6 grid gap-5 lg:grid-cols-3">
  <div class="space-y-5 lg:col-span-2">
    <div class="admin-card space-y-4 p-6">
      <label class="block text-sm font-bold">اسم المنتج<input name="name" required value="<?= e($p['name'] ?? '') ?>" class="admin-input mt-1.5"></label>
      <label class="block text-sm font-bold">الرابط (slug)<input name="slug" dir="ltr" value="<?= e($p['slug'] ?? '') ?>" placeholder="يُنشأ تلقائياً إن تُرك فارغاً" class="admin-input mt-1.5 text-left"></label>
      <label class="block text-sm font-bold">الوصف<textarea name="description" rows="6" class="admin-input mt-1.5 resize-none"><?= e($p['description'] ?? '') ?></textarea></label>
    </div>
    <div class="admin-card space-y-4 p-6">
      <h2 class="font-extrabold">الصور</h2>
      <label class="block text-sm font-bold">رابط الصورة الرئيسية<input name="image" dir="ltr" value="<?= e($p['image'] ?? '') ?>" class="admin-input mt-1.5 text-left" placeholder="images/...jpg أو https://..."></label>
      <label class="block text-sm font-bold">أو رفع صورة جديدة<input type="file" name="image_file" accept="image/*" class="admin-input mt-1.5"></label>
      <label class="block text-sm font-bold">صور إضافية (رابط في كل سطر)<textarea name="images" dir="ltr" rows="4" class="admin-input mt-1.5 resize-none text-left"><?= e($imagesText) ?></textarea></label>
      <?php if ($p && $p['image']): ?><img src="<?= e(img_url($p['image'])) ?>" class="h-24 w-24 rounded-2xl object-cover" alt=""><?php endif; ?>
    </div>
  </div>
  <div class="space-y-5">
    <div class="admin-card space-y-4 p-6">
      <label class="block text-sm font-bold">السعر<input name="price" type="number" step="0.01" min="0" required value="<?= e((string)($p['price'] ?? '')) ?>" class="admin-input mt-1.5"></label>
      <label class="block text-sm font-bold">السعر قبل الخصم (اختياري)<input name="old_price" type="number" step="0.01" min="0" value="<?= e((string)($p['old_price'] ?? '')) ?>" class="admin-input mt-1.5"></label>
      <label class="block text-sm font-bold">المخزون<input name="stock" type="number" min="0" value="<?= e((string)($p['stock'] ?? 0)) ?>" class="admin-input mt-1.5"></label>
      <label class="block text-sm font-bold">شارة (مثال: جديد، خصم)<input name="badge" value="<?= e($p['badge'] ?? '') ?>" class="admin-input mt-1.5"></label>
    </div>
    <div class="admin-card space-y-4 p-6">
      <label class="block text-sm font-bold">التصنيف<select name="category_id" class="admin-input mt-1.5"><option value="">بدون</option><?php foreach ($cats as $c): ?><option value="<?= (int)$c['id'] ?>" <?= ($p['category_id'] ?? null) == $c['id'] ? 'selected' : '' ?>><?= e($c['name']) ?></option><?php endforeach; ?></select></label>
      <label class="block text-sm font-bold">الماركة<select name="brand_id" class="admin-input mt-1.5"><option value="">بدون</option><?php foreach ($brands as $b): ?><option value="<?= (int)$b['id'] ?>" <?= ($p['brand_id'] ?? null) == $b['id'] ? 'selected' : '' ?>><?= e($b['name']) ?></option><?php endforeach; ?></select></label>
      <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="featured" <?= ($p['featured'] ?? 0) ? 'checked' : '' ?> class="h-4 w-4"> منتج مميز</label>
      <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="active" <?= ($p['active'] ?? 1) ? 'checked' : '' ?> class="h-4 w-4"> ظاهر في المتجر</label>
    </div>
    <button class="admin-btn w-full justify-center py-3.5 text-base"><?= icon('check', 18) ?> حفظ المنتج</button>
  </div>
</form>
<?php admin_footer(); ?>
