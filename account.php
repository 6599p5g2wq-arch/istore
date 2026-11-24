<?php
require __DIR__ . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';

$error = ''; $notice = ''; $tab = $_GET['tab'] ?? 'login';
$cur = customer_user();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    if ($action === 'logout') {
        customer_logout();
        header('Location: ' . url('account.php'));
        exit;
    }
    if ($action === 'register') {
        $tab = 'register';
        $name = mb_substr(trim($_POST['name'] ?? ''), 0, 100);
        $email = mb_strtolower(trim($_POST['email'] ?? ''));
        $phone = trim($_POST['phone'] ?? '');
        $password = (string)($_POST['password'] ?? '');
        if (rate_limited('reg:' . client_ip(), 10)) $error = 'محاولات كثيرة، حاول بعد قليل';
        elseif (!$name) $error = 'الاسم مطلوب';
        elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $error = 'البريد الإلكتروني غير صحيح';
        else {
            $r = customer_register($name, $email, $phone, $password);
            if ($r['ok']) { header('Location: ' . url('account.php')); exit; }
            $error = $r['error'];
        }
    } elseif ($action === 'login') {
        $idf = trim($_POST['identifier'] ?? ($_POST['email'] ?? ''));
        $rk = 'login-account:' . hash('sha256',mb_strtolower($idf));
        if(rate_limited('login-ip:'.client_ip(),40)){http_response_code(429);exit('محاولات كثيرة، حاول لاحقا');}
        if (rate_limited($rk, 8)) $error = 'محاولات دخول كثيرة، حاول بعد 15 دقيقة';
        else {
            $r = customer_login($idf, (string)($_POST['password'] ?? ''));
            if ($r['ok']) { rate_reset($rk); header('Location: ' . url('account.php')); exit; }
            $error = $r['error'];
        }
    } elseif ($action === 'profile' && $cur) {
        $name = mb_substr(trim($_POST['name'] ?? ''), 0, 100);
        $email = mb_strtolower(trim($_POST['email'] ?? ''));
        $phone = normalize_libyan_phone($_POST['phone'] ?? '');
        $city = mb_substr(trim($_POST['city'] ?? ''), 0, 80);
        $address = mb_substr(trim($_POST['address'] ?? ''), 0, 300);
        if (!$name) $error = 'الاسم مطلوب';
        elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $error = 'البريد الإلكتروني غير صحيح';
        elseif (!$phone) $error = 'رقم الهاتف غير صحيح (مثال: 0912345678)';
        elseif (qone('SELECT id FROM customers WHERE email = ? AND id != ?', [$email, $cur['id']])) $error = 'هذا البريد مستخدم في حساب آخر';
        elseif (qone('SELECT id FROM customers WHERE phone = ? AND id != ?', [$phone, $cur['id']])) $error = 'هذا الرقم مستخدم في حساب آخر';
        else {
            q('UPDATE customers SET name = ?, email = ?, phone = ?, city = ?, address = ? WHERE id = ?', [$name, $email, $phone, $city, $address, $cur['id']]);
            $notice = 'تم حفظ بياناتك';
        }
    } elseif ($action === 'password' && $cur) {
        $row = qone('SELECT pass_hash FROM customers WHERE id = ?', [$cur['id']]);
        $new = (string)($_POST['next'] ?? '');
        if (rate_limited('pw:' . client_ip(), 10)) $error = 'محاولات كثيرة، حاول بعد قليل';
        elseif (!password_verify((string)($_POST['current'] ?? ''), $row['pass_hash'])) $error = 'كلمة المرور الحالية غير صحيحة';
        elseif (mb_strlen($new) < 8) $error = 'كلمة المرور الجديدة 8 أحرف على الأقل';
        else {
            customer_change_password((int)$cur['id'],$new,0,(string)($_COOKIE['istore_customer'] ?? ($_SESSION['istore_customer'] ?? '')));
            $notice = 'تم تغيير كلمة المرور';
        }
    } elseif ($action === 'reorder' && $cur) {
        // إعادة طلب سابق: أسعار ومخزون اليوم، وتُكتب في سلة المتصفح ثم نذهب لصفحة السلة
        $order = qone('SELECT id FROM orders WHERE code = ? AND customer_id = ?', [(string)($_POST['code'] ?? ''), $cur['id']]);
        $lines = [];
        if ($order) {
            foreach (qall('SELECT product_id, variant_id, qty FROM order_items WHERE order_id = ?', [$order['id']]) as $l) {
                $p = $l['product_id'] ? qone('SELECT id, name, slug, price, image, stock FROM products WHERE id = ? AND active = 1', [$l['product_id']]) : null;
                if (!$p) continue;
                $price = (float)$p['price']; $stock = (int)$p['stock']; $label = '';
                if ($l['variant_id']) {
                    $v = qone('SELECT label, price, stock FROM product_variants WHERE id = ? AND product_id = ?', [$l['variant_id'], $p['id']]);
                    if (!$v) continue;
                    $price = $v['price'] !== null ? (float)$v['price'] : $price; $stock = (int)$v['stock']; $label = $v['label'];
                }
                if ($stock < 1) continue;
                $lines[] = ['id' => (int)$p['id'], 'name' => $p['name'], 'price' => $price, 'image' => img_url($p['image']), 'slug' => $p['slug'], 'stock' => $stock, 'variant_id' => (int)$l['variant_id'], 'variant_label' => $label, 'qty' => min((int)$l['qty'], $stock)];
            }
        }
        if ($lines) {
            echo '<!doctype html><meta charset="utf-8"><script>(function(){var add=' . json_encode($lines, JSON_UNESCAPED_UNICODE|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT) . ';var cart=[];try{cart=JSON.parse(localStorage.getItem("istore-cart")||"[]")}catch(e){}'
               . 'add.forEach(function(n){var f=null;cart.forEach(function(i){if(i.id===n.id&&(i.variant_id||0)===n.variant_id)f=i});if(f)f.qty=Math.min(f.qty+n.qty,n.stock);else cart.push(n)});'
               . 'localStorage.setItem("istore-cart",JSON.stringify(cart));location.href=' . json_encode(url('cart.php')) . ';})();</script>';
            exit;
        }
        $error = 'منتجات هذا الطلب غير متوفرة حالياً';
    }
}

$customer = customer_user();
$page_title = 'حسابي';
require APP_ROOT . '/includes/store-header.php';
?>
<?php if (!$customer): ?>
<div class="mx-auto max-w-xl px-4 pt-12 sm:px-6">
  <h1 class="text-center text-3xl font-black sm:text-4xl">حسابي</h1>
  <p class="mt-3 text-center text-[var(--text-dim)]">سجل دخولك لمتابعة طلباتك وبياناتك</p>

  <div class="mx-auto mt-10 max-w-md rounded-3xl border border-[var(--border)] bg-white/[0.04] p-7"><div class="mb-6 grid grid-cols-2 gap-2 rounded-full bg-[var(--card)] p-1 text-sm font-bold">
    <a data-auth-tab="login" href="<?= url('account.php?tab=login') ?>" class="rounded-full py-2.5 text-center <?= $tab !== 'register' ? 'bg-white text-black' : 'text-[var(--text-dim)]' ?>">تسجيل الدخول</a>
    <a data-auth-tab="register" href="<?= url('account.php?tab=register') ?>" class="rounded-full py-2.5 text-center <?= $tab === 'register' ? 'bg-white text-black' : 'text-[var(--text-dim)]' ?>">حساب جديد</a>
  </div>

  <?php if ($error): ?><p class="mt-4 rounded-2xl bg-red-500/10 p-3 text-center text-sm font-bold text-red-400"><?= e($error) ?></p><?php endif; ?>

  <form data-auth-form="register" method="post" class="space-y-4 <?=$tab==='register'?'':'hidden'?>">
    <input type="hidden" name="action" value="register">
    <label class="block text-sm font-bold"><span class="mb-1.5 flex items-center gap-1.5"><?= icon('user', 15) ?> الاسم الكامل</span>
      <input name="name" required class="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 outline-none transition placeholder:text-[var(--text-dim)] placeholder:opacity-90 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20" placeholder="مثال: محمد أحمد"></label>
    <label class="block text-sm font-bold"><span class="mb-1.5 flex items-center gap-1.5"><?= icon('phone', 15) ?> رقم الهاتف</span>
      <input name="phone" required dir="ltr" inputmode="tel" placeholder="09XXXXXXXX" class="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-left outline-none transition placeholder:text-[var(--text-dim)] placeholder:opacity-90 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20"></label>
    <label class="block text-sm font-bold"><span class="mb-1.5 flex items-center gap-1.5"><?= icon('mail', 15) ?> البريد الإلكتروني</span>
      <input type="email" name="email" required dir="ltr" class="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-left outline-none transition placeholder:text-[var(--text-dim)] placeholder:opacity-90 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20" placeholder="you@example.com"></label>
    <label class="block text-sm font-bold"><span class="mb-1.5 flex items-center gap-1.5"><?= icon('lock', 15) ?> كلمة المرور</span>
      <input type="password" name="password" required minlength="8" autocomplete="new-password" dir="ltr" class="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-left outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20" placeholder="8 أحرف على الأقل"></label>
    <button class="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 font-bold text-black transition hover:bg-neutral-200 disabled:opacity-60">إنشاء الحساب</button>
  </form>
  <form data-auth-form="login" method="post" class="space-y-4 <?=$tab!=='register'?'':'hidden'?>">
    <input type="hidden" name="action" value="login">
    <label class="block text-sm font-bold"><span class="mb-1.5 flex items-center gap-1.5"><?= icon('mail', 15) ?> البريد الإلكتروني أو رقم الهاتف</span>
      <input name="identifier" required autocomplete="username" placeholder="name@mail.com أو 09XXXXXXXX" dir="ltr" class="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-left outline-none transition placeholder:text-[var(--text-dim)] placeholder:opacity-90 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20"></label>
    <label class="block text-sm font-bold"><span class="mb-1.5 flex items-center gap-1.5"><?= icon('lock', 15) ?> كلمة المرور</span>
      <input type="password" name="password" required dir="ltr" class="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-left outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20"></label>
    <button class="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 font-bold text-black transition hover:bg-neutral-200 disabled:opacity-60">دخول</button>
    <p class="text-center text-sm text-[var(--text-dim)]">نسيت كلمة المرور؟ <a href="https://wa.me/<?= e(preg_replace('/\D+/', '', setting('whatsapp', ''))) ?>?text=<?= rawurlencode('السلام عليكم، نسيت كلمة مرور حسابي في المتجر وأحتاج إعادة تعيينها.') ?>" target="_blank" rel="noopener" class="font-bold text-[var(--accent)] hover:underline">تواصل معنا عبر واتساب</a></p>
  </form>

</div>
</div>
<?php else:
  $orders = qall('SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC LIMIT 20', [$customer['id']]);
  $prog = program();
  $spent = (float)(qone("SELECT COALESCE(SUM(total), 0) s FROM orders WHERE customer_id = ? AND status != 'cancelled'", [$customer['id']])['s'] ?? 0);
  $vipRow = qone('SELECT vip_override FROM customers WHERE id = ?', [$customer['id']]);
  $isVip = is_vip($spent, $vipRow['vip_override'] ?? null, $prog);
  $today = date('Y-m-d');
  $myCoupons = array_values(array_filter(qall('SELECT code, kind, value, expires_at, max_uses, used_count FROM coupons WHERE customer_id = ? AND active = 1 ORDER BY id DESC', [$customer['id']]),
      fn($c) => (!$c['expires_at'] || $c['expires_at'] >= $today) && ((int)$c['max_uses'] === 0 || (int)$c['used_count'] < (int)$c['max_uses'])));
  $cityNames = array_column(qall('SELECT name FROM cities WHERE active = 1 ORDER BY sort_order, name'), 'name');
?>
<div class="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-black">مرحباً، <?= e($customer['name']) ?> 👋<?php if ($isVip): ?><span class="mr-3 rounded-full bg-amber-500/15 px-3 py-1 align-middle text-sm font-extrabold text-amber-400">★ VIP</span><?php endif; ?></h1>
      <p class="mt-2 flex flex-wrap items-center gap-4 text-sm text-[var(--text-dim)]">
        <span class="flex items-center gap-1.5"><?= icon('mail', 14) ?> <span dir="ltr"><?= e($customer['email']) ?></span></span>
        <?php if ($customer['phone']): ?><span class="flex items-center gap-1.5"><?= icon('phone', 14) ?> <span dir="ltr"><?= e($customer['phone']) ?></span></span><?php endif; ?>
      </p>
    </div>
    <form method="post"><input type="hidden" name="action" value="logout">
      <button class="rounded-full border border-[var(--border)] px-5 py-2 text-sm font-bold text-[var(--text-dim)] transition hover:bg-red-500/10 hover:text-red-400">تسجيل الخروج</button>
    </form>
  </div>

  <?php if ($error): ?><p class="mt-6 rounded-2xl bg-red-500/10 p-3 text-center text-sm font-bold text-red-400"><?= e($error) ?></p><?php endif; ?>
  <?php if ($notice): ?><p class="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-center text-sm font-bold text-emerald-400"><?= e($notice) ?></p><?php endif; ?>
  <?php if ($myCoupons || ($prog['loyalty_enabled'] && (int)$customer['points'] > 0)): ?>
  <div class="mt-8 grid gap-3 sm:grid-cols-2">
    <?php foreach ($myCoupons as $c): ?>
      <div class="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4">
        <p class="flex items-center gap-2 text-sm font-bold text-[var(--text-dim)]"><?= icon('ticket', 16, 'text-[var(--accent)]') ?> كوبونك الخاص</p>
        <p class="mt-2 text-xl font-black" dir="ltr"><?= e($c['code']) ?></p>
        <p class="mt-1 text-xs text-[var(--text-dim)]"><?= $c['kind'] === 'percent' ? 'خصم ' . rtrim(rtrim(number_format((float)$c['value'], 2), '0'), '.') . '%' : 'خصم ' . e(format_price((float)$c['value'])) ?><?= $c['expires_at'] ? ' · صالح حتى ' . e($c['expires_at']) : '' ?> · خاص بحسابك فقط</p>
      </div>
    <?php endforeach; ?>
    <?php if ($prog['loyalty_enabled'] && (int)$customer['points'] > 0): ?>
      <div class="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4">
        <p class="flex items-center gap-2 text-sm font-bold text-[var(--text-dim)]"><?= icon('gift', 16, 'text-[var(--accent)]') ?> نقاط الولاء</p>
        <p class="mt-2 text-xl font-black"><?= (int)$customer['points'] ?> نقطة</p>
        <p class="mt-1 text-xs text-[var(--text-dim)]"><?= (int)$prog['redeem_points'] ?> نقطة = <?= e(format_price($prog['redeem_value'])) ?> خصم عند إتمام الطلب</p>
      </div>
    <?php endif; ?>
  </div>
  <?php endif; ?>
  <h2 class="mt-12 flex items-center gap-2 text-xl font-extrabold"><?= icon('package', 20, 'text-[var(--accent)]') ?> طلباتي</h2>
  <?php if (!$orders): ?>
    <div class="mt-6 rounded-3xl bg-[var(--card)] py-16 text-center">
      <p class="font-bold text-[var(--text-dim)]">لا توجد طلبات بعد</p>
      <a href="<?= url('products.php') ?>" class="glow-btn mt-5 inline-block rounded-full px-8 py-3 font-bold">تسوق الآن</a>
    </div>
  <?php else: ?>
    <ul class="mt-6 space-y-3">
      <?php foreach ($orders as $o): ?>
        <li class="rounded-2xl border border-[var(--border)] bg-white/[0.04] px-5 py-4"><a href="<?=e(url('order-success.php?code='.rawurlencode($o['code'])))?>" class="flex flex-wrap items-center gap-3 transition hover:opacity-80"><span class="font-extrabold text-white" dir="ltr"><?=e($o['code'])?></span><span class="rounded-full px-3 py-1 text-xs font-bold <?=order_status_class($o['status'])?>"><?=e(order_status_label($o['status']))?></span><span class="mr-auto text-sm text-[var(--text-dim)]"><?=e(format_date($o['created_at']))?></span><span class="font-extrabold text-white"><?=e(format_price($o['total']))?></span></a>
          <div class="mt-3 flex w-full flex-wrap items-center gap-4 border-t border-[var(--border)] pt-3">
            <?php if ($o['status'] === 'cancelled'): ?>
              <span class="text-xs font-bold text-red-400">تم إلغاء هذا الطلب</span>
            <?php else: $steps = ['new' => 'قيد المراجعة', 'confirmed' => 'مؤكد', 'shipped' => 'في الطريق', 'delivered' => 'تم التوصيل']; $idx = array_search($o['status'], array_keys($steps), true); $n = 0; ?>
              <ol class="flex flex-1 items-center gap-1 text-[11px] font-bold">
                <?php foreach ($steps as $k => $label): $done = $n <= (int)$idx; ?>
                  <li class="flex flex-1 items-center gap-1">
                    <span class="grid h-5 w-5 shrink-0 place-items-center rounded-full <?= $done ? 'bg-emerald-500 text-black' : 'bg-[var(--chip)] text-[var(--text-dim)]' ?>"><?= $done ? '✓' : $n + 1 ?></span>
                    <span class="hidden sm:inline <?= $done ? '' : 'text-[var(--text-dim)]' ?>"><?= e($label) ?></span>
                    <?php if ($n < 3): ?><span class="h-px flex-1 <?= $n < (int)$idx ? 'bg-emerald-500' : 'bg-[var(--border-strong)]' ?>"></span><?php endif; ?>
                  </li>
                <?php $n++; endforeach; ?>
              </ol>
            <?php endif; ?>
            <form method="post"><input type="hidden" name="action" value="reorder"><input type="hidden" name="code" value="<?= e($o['code']) ?>">
              <button class="flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[var(--chip)]"><?=icon('refresh-cw',13)?> اطلب مجدداً</button>
            </form>
          </div>
        </li>
      <?php endforeach; ?>
    </ul>
  <?php endif; ?>

  <h2 class="mt-14 flex items-center gap-2 text-xl font-extrabold"><?= icon('user', 20, 'text-[var(--accent)]') ?> بياناتي وعنوان التوصيل</h2>
  <p class="mt-1 text-sm text-[var(--text-dim)]">تُعبّأ تلقائياً عند إتمام الطلب.</p>
  <form method="post" class="mt-6 grid gap-4 rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6 sm:grid-cols-2">
    <input type="hidden" name="action" value="profile">
    <label class="text-sm font-bold">الاسم<input name="name" required value="<?= e($customer['name']) ?>" class="mt-1.5 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"></label>
    <label class="text-sm font-bold">رقم الهاتف<input name="phone" required dir="ltr" value="<?= e($customer['phone']) ?>" class="mt-1.5 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"></label>
    <label class="text-sm font-bold sm:col-span-2">البريد الإلكتروني<input type="email" name="email" required dir="ltr" value="<?= e($customer['email']) ?>" class="mt-1.5 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"></label>
    <label class="text-sm font-bold">المدينة (للتوصيل)
      <select name="city" class="mt-1.5 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3 outline-none transition focus:border-[var(--accent)]">
        <option value="">— اختر —</option>
        <?php foreach ($cityNames as $cn): ?><option value="<?= e($cn) ?>" <?= $customer['city'] === $cn ? 'selected' : '' ?>><?= e($cn) ?></option><?php endforeach; ?>
      </select>
    </label>
    <label class="text-sm font-bold">العنوان<input name="address" value="<?= e($customer['address']) ?>" placeholder="الحي، الشارع، أقرب معلم" class="mt-1.5 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"></label>
    <button class="flex items-center justify-center gap-2 rounded-full bg-white py-3 font-bold text-black transition hover:bg-neutral-200 sm:col-span-2"><?=icon('edit',16)?> حفظ التعديلات</button>
  </form>

  <h2 id="password" class="mt-14 flex items-center gap-2 text-xl font-extrabold"><?= icon('lock', 20, 'text-[var(--accent)]') ?> كلمة المرور</h2>
  <form method="post" class="mt-6 grid gap-4 rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6 sm:grid-cols-2">
    <input type="hidden" name="action" value="password">
    <?php if (!empty($customer['must_change'])): ?><p class="rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-400 sm:col-span-2">دخلت بكلمة مرور مؤقتة من الإدارة. غيّرها الآن إلى كلمة مرور خاصة بك.</p><?php endif; ?>
    <label class="text-sm font-bold">كلمة المرور الحالية<input type="password" name="current" required dir="ltr" autocomplete="current-password" class="mt-1.5 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"></label>
    <label class="text-sm font-bold">كلمة المرور الجديدة (8 أحرف على الأقل)<input type="password" name="next" required minlength="8" dir="ltr" autocomplete="new-password" class="mt-1.5 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"></label>
    <button class="rounded-full border border-[var(--border-strong)] py-3 font-bold transition hover:bg-[var(--chip)] sm:col-span-2">تغيير كلمة المرور</button>
  </form>
  <div class="h-8"></div>
</div>
<?php endif; ?>
<script>document.querySelectorAll('input[type=password]').forEach(function(input){var wrap=document.createElement('div');wrap.className='relative';input.parentNode.insertBefore(wrap,input);wrap.append(input);input.classList.add('pl-14');var b=document.createElement('button');b.type='button';b.className='absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-dim)]';b.innerHTML=<?=json_encode(icon('eye',18))?>;b.setAttribute('aria-label','إظهار كلمة المرور');b.onclick=function(){var show=input.type==='password';input.type=show?'text':'password';b.innerHTML=show?<?=json_encode(icon('eye-off',18))?>:<?=json_encode(icon('eye',18))?>;b.setAttribute('aria-pressed',String(show));};wrap.append(b);});</script>
<script>document.querySelectorAll('[data-auth-tab]').forEach(function(a){a.onclick=function(e){e.preventDefault();var tab=a.dataset.authTab;document.querySelectorAll('[data-auth-form]').forEach(f=>f.classList.toggle('hidden',f.dataset.authForm!==tab));document.querySelectorAll('[data-auth-tab]').forEach(t=>{var active=t.dataset.authTab===tab;t.classList.toggle('bg-white',active);t.classList.toggle('text-black',active);t.classList.toggle('text-[var(--text-dim)]',!active);});history.replaceState(null,'',a.href);};});</script>
<?php require APP_ROOT . '/includes/store-footer.php'; ?>
