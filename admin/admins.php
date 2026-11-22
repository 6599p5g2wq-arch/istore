<?php
require_once __DIR__ . '/_init.php';
$me = require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $id = (int)($_POST['id'] ?? 0);
    if ($action === 'add') {
        $username = mb_substr(trim($_POST['username'] ?? ''), 0, 100);
        $password = (string)($_POST['password'] ?? '');
        if (!$username || mb_strlen($password) < 6) { flash('اسم المستخدم وكلمة مرور 6 أحرف على الأقل مطلوبان', true); redirect_admin('admins.php'); }
        if (qone('SELECT id FROM admin_users WHERE username = ?', [$username])) { flash('اسم المستخدم موجود', true); redirect_admin('admins.php'); }
        q('INSERT INTO admin_users (username, pass_hash) VALUES (?, ?)', [$username, password_hash($password, PASSWORD_DEFAULT)]);
        flash('تمت إضافة المشرف');
    } elseif ($action === 'password' && $id) {
        $password = (string)($_POST['password'] ?? '');
        if (mb_strlen($password) < 6) { flash('كلمة المرور 6 أحرف على الأقل', true); redirect_admin('admins.php'); }
        q('UPDATE admin_users SET pass_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $id]);
        flash('تم تغيير كلمة المرور');
    } elseif ($action === 'delete' && $id) {
        if ($id === (int)$me['id']) { flash('لا يمكنك حذف حسابك الحالي', true); redirect_admin('admins.php'); }
        if ((int)qone('SELECT COUNT(*) c FROM admin_users')['c'] <= 1) { flash('يجب أن يبقى مشرف واحد على الأقل', true); redirect_admin('admins.php'); }
        q('DELETE FROM admin_users WHERE id = ?', [$id]);
        flash('تم حذف المشرف');
    }
    redirect_admin('admins.php');
}
$admins = qall('SELECT id, username, created_at FROM admin_users ORDER BY id');
admin_header('المشرفون', 'admins.php');
?>
<h1 class="text-2xl font-black sm:text-3xl">المشرفون</h1>
<?php admin_msg(); ?>
<div class="mt-6 grid gap-5 lg:grid-cols-3">
  <div class="admin-card h-fit p-6">
    <h2 class="font-extrabold">مشرف جديد</h2>
    <form method="post" class="mt-4 space-y-3">
      <input type="hidden" name="action" value="add">
      <label class="block text-sm font-bold">اسم المستخدم<input name="username" required class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">كلمة المرور<input type="password" name="password" required minlength="6" class="admin-input mt-1"></label>
      <button class="admin-btn w-full justify-center"><?= icon('plus', 16) ?> إضافة</button>
    </form>
  </div>
  <div class="space-y-3 lg:col-span-2">
    <?php foreach ($admins as $a): ?>
      <div class="admin-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div><b><?= e($a['username']) ?></b><?= $a['id'] == $me['id'] ? ' <span class="badge bg-violet-100 text-violet-700">أنت</span>' : '' ?><p class="text-xs text-neutral-400"><?= e(format_date($a['created_at'])) ?></p></div>
        <div class="flex items-center gap-2">
          <form method="post" class="flex items-center gap-2"><input type="hidden" name="action" value="password"><input type="hidden" name="id" value="<?= (int)$a['id'] ?>"><input type="password" name="password" required minlength="6" placeholder="كلمة مرور جديدة" class="admin-input w-40"><button class="admin-btn-ghost">تغيير</button></form>
          <?php if ($a['id'] != $me['id']): ?><form method="post" onsubmit="return confirm('حذف المشرف؟')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$a['id'] ?>"><button class="admin-btn-ghost admin-btn-danger"><?= icon('trash', 15) ?></button></form><?php endif; ?>
        </div>
      </div>
    <?php endforeach; ?>
  </div>
</div>
<?php admin_footer(); ?>
