<?php
require __DIR__ . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';
$cities = qall('SELECT * FROM cities WHERE active = 1 ORDER BY sort_order, name');
$threshold = (float)setting('free_shipping_threshold', '0');
$page_title = 'إتمام الطلب';
require APP_ROOT . '/includes/store-header.php';
?>
<div class="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
  <h1 class="text-3xl font-black sm:text-4xl">إتمام الطلب</h1>
  <div id="checkout-root" class="mt-8"></div>
</div>

<script>
var CITIES = <?= json_encode(array_map(fn($c) => ['name' => $c['name'], 'fee' => (float)$c['fee']], $cities), JSON_UNESCAPED_UNICODE) ?>;
var FREE_THRESHOLD = <?= json_encode($threshold) ?>;
var discount = 0, couponCode = '';

function cityFee() {
  var sel = document.getElementById('f-city');
  var c = CITIES.find(function (x) { return x.name === sel.value; });
  var sub = Cart.total();
  if (FREE_THRESHOLD > 0 && sub - discount >= FREE_THRESHOLD) return 0;
  return c ? c.fee : 0;
}

function renderSummary() {
  var sub = Cart.total(), fee = cityFee(), total = sub - discount + fee;
  document.getElementById('sum-sub').textContent = window.fmtPrice(sub);
  document.getElementById('sum-discount-row').classList.toggle('hidden', discount <= 0);
  document.getElementById('sum-discount').textContent = '-' + window.fmtPrice(discount);
  document.getElementById('sum-fee').textContent = fee === 0 ? 'مجاني' : window.fmtPrice(fee);
  document.getElementById('sum-total').textContent = window.fmtPrice(Math.max(total, 0));
  var items = document.getElementById('sum-items');
  items.innerHTML = Cart.items.map(function (i) {
    return '<div class="flex items-center gap-3 text-sm"><img src="' + i.image + '" class="h-12 w-12 rounded-xl object-cover" alt="">'
      + '<span class="flex-1 line-clamp-1">' + i.name + ' <span class="text-[var(--text-faint)]">× ' + i.qty + '</span></span>'
      + '<b>' + window.fmtPrice(i.price * i.qty) + '</b></div>';
  }).join('');
}

function applyCoupon() {
  var inp = document.getElementById('f-coupon'), msg = document.getElementById('coupon-msg');
  var code = inp.value.trim();
  if (!code) { discount = 0; couponCode = ''; renderSummary(); return; }
  fetch(window.BASE + '/api/coupon-validate.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code, subtotal: Cart.total() }) })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.ok) { discount = d.discount; couponCode = code; msg.textContent = 'تم تطبيق الخصم: -' + window.fmtPrice(d.discount); msg.className = 'mt-2 text-sm font-bold text-emerald-400'; }
      else { discount = 0; couponCode = ''; msg.textContent = d.error || 'كود غير صالح'; msg.className = 'mt-2 text-sm font-bold text-red-400'; }
      renderSummary();
    });
}

function submitOrder(ev) {
  ev.preventDefault();
  var btn = document.getElementById('submit-btn'), err = document.getElementById('order-err');
  btn.disabled = true; btn.textContent = 'جارٍ إرسال الطلب...';
  err.classList.add('hidden');
  var body = {
    name: document.getElementById('f-name').value.trim(),
    phone: document.getElementById('f-phone').value.trim(),
    city: document.getElementById('f-city').value,
    address: document.getElementById('f-address').value.trim(),
    notes: document.getElementById('f-notes').value.trim(),
    coupon: couponCode,
    items: Cart.items.map(function (i) { return { id: i.id, qty: i.qty }; })
  };
  fetch(window.BASE + '/api/order.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) {
      if (res.ok && res.d.ok) {
        Cart.clear();
        location.href = window.BASE + '/order-success.php?code=' + encodeURIComponent(res.d.code);
      } else {
        err.textContent = res.d.error || 'حدث خطأ، حاول مرة أخرى';
        err.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'تأكيد الطلب';
      }
    })
    .catch(function () {
      err.textContent = 'تعذر الاتصال بالخادم، حاول مرة أخرى';
      err.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'تأكيد الطلب';
    });
  return false;
}

// تسجيل السلة المهجورة عند إدخال رقم هاتف صحيح
function captureLead() {
  var phone = document.getElementById('f-phone').value.trim();
  if (phone.length < 8 || !Cart.items.length) return;
  fetch(window.BASE + '/api/cart-lead.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phone, items: Cart.items, total: Cart.total() }) }).catch(function () {});
}

window.initCheckoutPage = function () {
  var root = document.getElementById('checkout-root');
  if (!Cart.items.length) {
    root.innerHTML = '<div class="grid place-items-center rounded-3xl bg-[var(--card)] py-24 text-center">'
      + '<p class="text-lg font-bold text-[var(--text-dim)]">سلتك فارغة</p>'
      + '<a href="' + window.BASE + '/products.php" class="glow-btn mt-6 inline-block rounded-full px-8 py-3 font-bold">ابدأ التسوق</a></div>';
    return;
  }
  root.innerHTML = '<form onsubmit="return submitOrder(event)" class="grid gap-8 lg:grid-cols-5">'
    + '<div class="space-y-4 lg:col-span-3">'
    + '<div class="rounded-3xl border border-[var(--border)] bg-[var(--card)] glass-card p-6">'
    + '<h2 class="mb-5 text-lg font-black">بيانات التوصيل</h2>'
    + '<div class="grid gap-4 sm:grid-cols-2">'
    + '<label class="block text-sm font-bold">الاسم الكامل<input id="f-name" required placeholder="مثال: محمد أحمد" class="mt-1.5 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 outline-none transition placeholder:text-neutral-600 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20"></label>'
    + '<label class="block text-sm font-bold">رقم الهاتف<input id="f-phone" required dir="ltr" inputmode="tel" placeholder="09XXXXXXXX" onblur="captureLead()" class="mt-1.5 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-left outline-none transition placeholder:text-neutral-600 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20"></label>'
    + '<label class="block text-sm font-bold">المدينة<select id="f-city" required onchange="renderSummary()" class="mt-1.5 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 outline-none transition focus:border-[var(--accent)]"><option value="">اختر مدينتك</option>'
    + CITIES.map(function (c) { return '<option value="' + c.name + '">' + c.name + '</option>'; }).join('')
    + '</select></label>'
    + '<label class="block text-sm font-bold">العنوان بالتفصيل<input id="f-address" placeholder="الحي، الشارع، أقرب معلم" class="mt-1.5 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 outline-none transition placeholder:text-neutral-600 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20"></label>'
    + '</div>'
    + '<label class="mt-4 block text-sm font-bold">ملاحظات إضافية<textarea id="f-notes" rows="3" placeholder="أي تفاصيل تساعدنا في التوصيل" class="mt-1.5 w-full resize-none rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 outline-none transition placeholder:text-neutral-600 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20"></textarea></label>'
    + '</div>'
    + '<div class="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-300">الدفع عند الاستلام — تدفع فقط عندما يصلك طلبك</div>'
    + '</div>'
    + '<div class="lg:col-span-2"><div class="sticky top-24 rounded-3xl border border-[var(--border)] bg-[var(--card)] glass-card p-6">'
    + '<h2 class="mb-4 text-lg font-black">ملخص الطلب</h2>'
    + '<div id="sum-items" class="mb-4 space-y-3"></div>'
    + '<div class="mb-4 flex gap-2"><input id="f-coupon" dir="ltr" placeholder="كود الخصم" class="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3 text-left outline-none placeholder:text-neutral-600 focus:border-[var(--accent)]">'
    + '<button type="button" onclick="applyCoupon()" class="shrink-0 rounded-2xl bg-[var(--chip)] px-4 text-sm font-bold transition hover:bg-[var(--chip-hover)]">تطبيق</button></div>'
    + '<p id="coupon-msg" class="mb-2"></p>'
    + '<div class="space-y-2 border-t border-[var(--border)] pt-4 text-sm">'
    + '<div class="flex justify-between"><span class="text-[var(--text-dim)]">المجموع الفرعي</span><b id="sum-sub"></b></div>'
    + '<div id="sum-discount-row" class="hidden flex justify-between text-emerald-400"><span>الخصم</span><b id="sum-discount"></b></div>'
    + '<div class="flex justify-between"><span class="text-[var(--text-dim)]">التوصيل</span><b id="sum-fee"></b></div>'
    + '<div class="flex justify-between border-t border-[var(--border)] pt-3 text-lg font-extrabold"><span>الإجمالي</span><span id="sum-total" class="text-[var(--accent)]"></span></div>'
    + '</div>'
    + '<p id="order-err" class="mt-3 hidden rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-400"></p>'
    + '<button id="submit-btn" class="glow-btn mt-5 w-full rounded-full py-4 text-lg font-bold transition hover:scale-[1.01] active:scale-95">تأكيد الطلب</button>'
    + '</div></div></form>';
  renderSummary();
};
</script>
<?php require APP_ROOT . '/includes/store-footer.php'; ?>
