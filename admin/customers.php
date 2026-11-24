<?php
require_once __DIR__ . '/_init.php';
require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    if ($action === 'create') {
        $name = mb_substr(trim($_POST['name'] ?? ''), 0, 100);
        $email = mb_strtolower(trim($_POST['email'] ?? ''));
        $phone = normalize_libyan_phone($_POST['phone'] ?? '');
        if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL) || !$phone) {
            flash('تحقق من الاسم والبريد ورقم الهاتف', true);
            redirect_admin('customers.php');
        }
        if (qone('SELECT id FROM customers WHERE email = ?', [$email])) { flash('البريد مستخدم في حساب آخر', true); redirect_admin('customers.php'); }
        if (qone('SELECT id FROM customers WHERE phone = ?', [$phone])) { flash('الرقم مستخدم في حساب آخر', true); redirect_admin('customers.php'); }
        $chars = 'abcdefghjkmnpqrstuvwxyz23456789';
        $pw = '';
        for ($i = 0; $i < 8; $i++) $pw .= $chars[random_int(0, strlen($chars) - 1)];
        q('INSERT INTO customers (name, email, phone, pass_hash, salt, must_change) VALUES (?, ?, ?, ?, ?, 1)',
          [$name, $email, $phone, password_hash($pw, PASSWORD_DEFAULT), '']);
        $_SESSION['admin_new_customer'] = ['name' => $name, 'phone' => $phone, 'password' => $pw];
        redirect_admin('customers.php');
    }
    redirect_admin('customers.php');
}

$tab = ($_GET['tab'] ?? '') === 'guests' ? 'guests' : 'accounts';
$sorts = ['new' => ['الأحدث', 'c.id DESC'], 'spent' => ['الأكثر شراءً', 'spent DESC'], 'orders' => ['الأكثر طلبات', 'oc DESC']];
$guestSorts = ['new' => ['الأحدث', 'last_order DESC'], 'spent' => ['الأكثر شراءً', 'spent DESC'], 'orders' => ['الأكثر طلبات', 'oc DESC']];
$sort = isset($sorts[$_GET['sort'] ?? '']) ? $_GET['sort'] : 'new';
$f = in_array($_GET['f'] ?? '', ['vip', 'blocked', 'active'], true) ? $_GET['f'] : 'all';
$accCount = (int)qone('SELECT COUNT(*) c FROM customers')['c'];
$guestCount = (int)qone('SELECT COUNT(DISTINCT phone) c FROM orders WHERE customer_id IS NULL')['c'];
$accounts = $guests = [];
if ($tab === 'accounts') {
    $accounts = qall("SELECT c.id, c.name, c.email, c.phone, c.created_at, c.blocked, c.points, c.vip_override, COUNT(o.id) oc,
        COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total END), 0) spent, MAX(o.created_at) last_order
        FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id, c.name, c.email, c.phone, c.created_at, c.blocked, c.points, c.vip_override ORDER BY " . $sorts[$sort][1]);
    $accounts = array_values(array_filter($accounts, function ($c) use ($f) {
        if ($f === 'vip') return is_vip((float)$c['spent'], $c['vip_override']);
        if ($f === 'blocked') return (int)$c['blocked'] === 1;
        if ($f === 'active') return (int)$c['blocked'] === 0;
        return true;
    }));
} else {
    $guests = qall("SELECT MAX(customer_name) name, phone, COUNT(*) oc, COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total END), 0) spent, MAX(created_at) last_order
        FROM orders WHERE customer_id IS NULL GROUP BY phone ORDER BY " . $guestSorts[$sort][1]);
}
$newCust = $_SESSION['admin_new_customer'] ?? null;
unset($_SESSION['admin_new_customer']);
$activeSorts = $tab === 'guests' ? $guestSorts : $sorts;

admin_header('الزبائن', 'customers.php');
?>
<div class="flex flex-wrap items-center justify-between gap-3">
  <h1 class="text-2xl font-black sm:text-3xl">الزبائن</h1>
  <div class="flex flex-wrap items-center gap-2">
    <button type="button" id="new-cust-open" class="admin-btn"><?= icon('plus', 16) ?> زبون جديد</button>
    <a href="<?= e(admin_url('customers-export.php?tab=' . $tab)) ?>" class="admin-btn-ghost"><?= icon('download', 16) ?> تصدير CSV</a>
  </div>
</div>
<?php admin_msg(); ?>
<?php if ($newCust): ?>
  <div class="admin-card mt-4 border-2 border-emerald-300 p-5">
    <p class="font-extrabold text-emerald-700">تم إنشاء حساب «<?= e($newCust['name']) ?>» بكلمة مرور مؤقتة — أرسلها للزبون، وسيُطلب منه تغييرها عند أول دخول:</p>
    <div class="mt-3 flex flex-wrap items-center gap-3">
      <code dir="ltr" class="rounded-xl bg-white px-4 py-2 text-lg font-extrabold tracking-wider"><?= e($newCust['password']) ?></code>
      <a href="https://wa.me/<?= e(wa_number($newCust['phone'])) ?>?text=<?= rawurlencode('السلام عليكم ' . $newCust['name'] . '، معك ' . setting('store_name', 'آي ستور') . ".\nأنشأنا لك حساباً في متجرنا.\nكلمة المرور المؤقتة: " . $newCust['password'] . "\nادخل بها ثم غيّرها من صفحة «حسابي».") ?>" target="_blank" rel="noopener" class="rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white">إرسالها عبر واتساب</a>
    </div>
  </div>
<?php endif; ?>
<div class="mt-6 flex flex-wrap gap-2">
  <a href="<?= e(admin_url('customers.php')) ?>" class="rounded-full px-4 py-1.5 text-sm font-bold <?= $tab === 'accounts' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600' ?>">حسابات مسجلة (<?= $accCount ?>)</a>
  <a href="<?= e(admin_url('customers.php?tab=guests')) ?>" class="rounded-full px-4 py-1.5 text-sm font-bold <?= $tab === 'guests' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600' ?>">عملاء بدون حساب (<?= $guestCount ?>)</a>
</div>
<div class="mt-4 flex flex-wrap items-center gap-3">
  <input id="cust-q" oninput="filterCustomers(this.value)" placeholder="ابحث بالاسم أو الهاتف<?= $tab === 'accounts' ? ' أو البريد' : '' ?>…" autocomplete="off" class="admin-input max-w-md">
  <div class="flex gap-2 text-xs font-bold">
    <?php foreach ($activeSorts as $k => $v): ?>
      <a href="<?= e(admin_url('customers.php?tab=' . $tab . '&sort=' . $k . ($tab === 'accounts' && $f !== 'all' ? '&f=' . $f : ''))) ?>" class="rounded-full px-3 py-1.5 <?= $sort === $k ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 shadow-sm' ?>"><?= e($v[0]) ?></a>
    <?php endforeach; ?>
  </div>
</div>
<?php if ($tab === 'accounts'): ?>
<div class="mt-3 flex flex-wrap gap-2 text-xs font-bold">
  <?php foreach (['all' => 'الكل', 'vip' => 'VIP', 'blocked' => 'موقوف', 'active' => 'نشط'] as $k => $label): ?>
    <a href="<?= e(admin_url('customers.php?sort=' . $sort . ($k === 'all' ? '' : '&f=' . $k))) ?>" class="rounded-full px-3 py-1.5 <?= $f === $k ? 'bg-violet-700 text-white' : 'bg-white text-neutral-500 shadow-sm' ?>"><?= e($label) ?></a>
  <?php endforeach; ?>
</div>
<?php endif; ?>

<?php if ($tab === 'accounts'): ?>
  <?php if (!$accounts): ?><p class="mt-4 rounded-3xl bg-white py-12 text-center text-sm text-neutral-400 shadow-sm"><?= $f === 'all' ? 'لا توجد حسابات مسجلة بعد' : 'لا يوجد زبائن ضمن هذا الفلتر' ?></p><?php endif; ?>
  <!-- بطاقات الجوال -->
  <div class="mt-4 space-y-3 lg:hidden">
    <?php foreach ($accounts as $c): ?>
    <div class="admin-card cust-row p-4" data-search="<?= e(mb_strtolower($c['name'] . ' ' . $c['phone'] . ' ' . $c['email'])) ?>">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <a href="<?= e(admin_url('customer.php?id=' . (int)$c['id'])) ?>" class="font-extrabold text-violet-700 hover:underline"><?= e($c['name']) ?></a>
          <?php if (is_vip((float)$c['spent'], $c['vip_override'])): ?> <span class="badge bg-amber-100 text-amber-700">★ VIP</span><?php endif; ?>
          <?php if ($c['blocked']): ?> <span class="badge bg-red-100 text-red-600">موقوف</span><?php endif; ?>
          <p class="mt-0.5 text-xs text-neutral-400" dir="ltr"><?= e($c['phone']) ?></p>
        </div>
        <div class="flex gap-1.5">
          <a href="tel:<?= e($c['phone']) ?>" class="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-700" title="اتصال"><?= icon('phone', 14) ?></a>
          <a href="https://wa.me/<?= e(wa_number($c['phone'])) ?>" target="_blank" rel="noopener" class="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white" title="واتساب"><?= icon('whatsapp', 14) ?></a>
        </div>
      </div>
      <div class="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div class="rounded-xl bg-neutral-50 py-2"><p class="text-neutral-400">الطلبات</p><p class="font-extrabold"><?= (int)$c['oc'] ?></p></div>
        <div class="rounded-xl bg-neutral-50 py-2"><p class="text-neutral-400">المشتريات</p><p class="font-extrabold"><?= e(format_price((float)$c['spent'])) ?></p></div>
        <div class="rounded-xl bg-neutral-50 py-2"><p class="text-neutral-400">النقاط</p><p class="font-extrabold"><?= (int)$c['points'] ?></p></div>
      </div>
    </div>
    <?php endforeach; ?>
  </div>
  <!-- جدول سطح المكتب -->
  <div class="admin-card mt-4 hidden overflow-x-auto lg:block">
    <table class="admin-table w-full min-w-[900px]">
      <thead><tr><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>الطلبات</th><th>إجمالي المشتريات</th><th>النقاط</th><th>آخر طلب</th><th>التسجيل</th><th></th></tr></thead>
      <tbody>
      <?php foreach ($accounts as $c): ?>
        <tr class="cust-row" data-search="<?= e(mb_strtolower($c['name'] . ' ' . $c['phone'] . ' ' . $c['email'])) ?>">
          <td><a href="<?= e(admin_url('customer.php?id=' . (int)$c['id'])) ?>" class="font-extrabold text-violet-700 hover:underline"><?= e($c['name']) ?></a><?php if (is_vip((float)$c['spent'], $c['vip_override'])): ?> <span class="badge bg-amber-100 text-amber-700">★ VIP</span><?php endif; ?><?php if ($c['blocked']): ?> <span class="badge bg-red-100 text-red-600">موقوف</span><?php endif; ?></td>
          <td dir="ltr" class="text-neutral-500"><?= e($c['phone']) ?></td>
          <td dir="ltr" class="text-neutral-500"><?= e($c['email']) ?></td>
          <td class="font-bold"><?= (int)$c['oc'] ?></td>
          <td class="font-bold"><?= e(format_price((float)$c['spent'])) ?></td>
          <td class="font-bold"><?= (int)$c['points'] ?></td>
          <td class="text-neutral-500"><?= $c['last_order'] ? e(format_date($c['last_order'])) : '—' ?></td>
          <td class="text-neutral-500"><?= e(format_date($c['created_at'])) ?></td>
          <td class="whitespace-nowrap">
            <a href="tel:<?= e($c['phone']) ?>" class="mr-1 inline-grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-700 align-middle" title="اتصال"><?= icon('phone', 14) ?></a>
            <a href="https://wa.me/<?= e(wa_number($c['phone'])) ?>" target="_blank" rel="noopener" class="inline-grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white align-middle" title="واتساب"><?= icon('whatsapp', 14) ?></a>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <div id="cust-empty" style="display:none" class="admin-card mt-4 py-10 text-center text-neutral-400">لا يوجد زبون مطابق</div>
<?php else: ?>
  <?php if (!$guests): ?><div class="admin-card mt-4 py-10 text-center text-neutral-400">لا يوجد عملاء بدون حساب</div><?php endif; ?>
  <!-- بطاقات الجوال للضيوف -->
  <div class="mt-4 space-y-3 lg:hidden">
    <?php foreach ($guests as $g): ?>
    <div class="admin-card cust-row p-4" data-search="<?= e(mb_strtolower($g['name'] . ' ' . $g['phone'])) ?>">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <a href="<?= e(admin_url('guest.php?phone=' . urlencode($g['phone']))) ?>" class="font-extrabold text-violet-700 hover:underline"><?= e($g['name']) ?></a>
          <p class="mt-0.5 text-xs text-neutral-400" dir="ltr"><?= e($g['phone']) ?></p>
        </div>
        <div class="flex gap-1.5">
          <a href="tel:<?= e($g['phone']) ?>" class="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-700" title="اتصال"><?= icon('phone', 14) ?></a>
          <a href="https://wa.me/<?= e(wa_number($g['phone'])) ?>" target="_blank" rel="noopener" class="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white" title="واتساب"><?= icon('whatsapp', 14) ?></a>
        </div>
      </div>
      <div class="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div class="rounded-xl bg-neutral-50 py-2"><p class="text-neutral-400">الطلبات</p><p class="font-extrabold"><?= (int)$g['oc'] ?></p></div>
        <div class="rounded-xl bg-neutral-50 py-2"><p class="text-neutral-400">المشتريات</p><p class="font-extrabold"><?= e(format_price((float)$g['spent'])) ?></p></div>
        <div class="rounded-xl bg-neutral-50 py-2"><p class="text-neutral-400">آخر طلب</p><p class="font-extrabold"><?= e(format_date($g['last_order'])) ?></p></div>
      </div>
    </div>
    <?php endforeach; ?>
  </div>
  <!-- جدول الضيوف لسطح المكتب -->
  <div class="admin-card mt-4 hidden overflow-x-auto lg:block">
    <table class="admin-table w-full min-w-[680px]">
      <thead><tr><th>الاسم</th><th>الهاتف</th><th>الطلبات</th><th>إجمالي المشتريات</th><th>آخر طلب</th><th></th></tr></thead>
      <tbody>
      <?php foreach ($guests as $g): ?>
        <tr class="cust-row" data-search="<?= e(mb_strtolower($g['name'] . ' ' . $g['phone'])) ?>">
          <td><a href="<?= e(admin_url('guest.php?phone=' . urlencode($g['phone']))) ?>" class="font-extrabold text-violet-700 hover:underline"><?= e($g['name']) ?></a></td>
          <td dir="ltr" class="text-neutral-500"><?= e($g['phone']) ?></td>
          <td class="font-bold"><?= (int)$g['oc'] ?></td>
          <td class="font-bold"><?= e(format_price((float)$g['spent'])) ?></td>
          <td class="text-neutral-500"><?= e(format_date($g['last_order'])) ?></td>
          <td class="whitespace-nowrap">
            <a href="tel:<?= e($g['phone']) ?>" class="mr-1 inline-grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-700 align-middle" title="اتصال"><?= icon('phone', 14) ?></a>
            <a href="https://wa.me/<?= e(wa_number($g['phone'])) ?>" target="_blank" rel="noopener" class="inline-grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white align-middle" title="واتساب"><?= icon('whatsapp', 14) ?></a>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <div id="cust-empty" style="display:none" class="admin-card mt-4 py-10 text-center text-neutral-400">لا يوجد زبون مطابق</div>
<?php endif; ?>

<div id="new-cust-modal" class="fixed inset-0 z-50 hidden place-items-center bg-black/50 p-4">
  <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
    <h2 class="font-extrabold">زبون جديد</h2>
    <form method="post" class="mt-4 space-y-3">
      <input type="hidden" name="action" value="create">
      <label class="block text-sm font-bold">الاسم<input name="name" required class="admin-input mt-1"></label>
      <label class="block text-sm font-bold">الهاتف<input name="phone" required dir="ltr" placeholder="09XXXXXXXX" class="admin-input mt-1 text-left"></label>
      <label class="block text-sm font-bold">البريد الإلكتروني<input name="email" type="email" required dir="ltr" class="admin-input mt-1 text-left"></label>
      <button class="admin-btn w-full justify-center"><?= icon('plus', 16) ?> إنشاء بكلمة مرور مؤقتة</button>
      <button type="button" id="new-cust-cancel" class="admin-btn-ghost w-full justify-center">إلغاء</button>
    </form>
  </div>
</div>

<script>
function filterCustomers(v) {
  var q = v.trim().toLowerCase(), n = 0;
  document.querySelectorAll('.cust-row').forEach(function (r) {
    var show = !q || (r.dataset.search || '').indexOf(q) !== -1;
    r.style.display = show ? '' : 'none';
    if (show) n++;
  });
  var e = document.getElementById('cust-empty');
  if (e) e.style.display = (n === 0 && document.querySelectorAll('.cust-row').length) ? '' : 'none';
}
(function(){
  var modal = document.getElementById('new-cust-modal');
  document.getElementById('new-cust-open').addEventListener('click', function(){ modal.classList.remove('hidden'); modal.classList.add('grid'); });
  function close(){ modal.classList.add('hidden'); modal.classList.remove('grid'); }
  document.getElementById('new-cust-cancel').addEventListener('click', close);
  modal.addEventListener('click', function(e){ if (e.target === modal) close(); });
})();
</script>
<?php admin_footer(); ?>
