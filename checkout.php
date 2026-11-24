<?php
require __DIR__ . '/includes/bootstrap.php';
require APP_ROOT . '/includes/auth.php';
$cities = qall('SELECT * FROM cities WHERE active = 1 ORDER BY sort_order, name');
$threshold = (float)setting('free_shipping_threshold', '0');
$page_title = 'إتمام الطلب';
$cu = customer_user();
$prog = program();
$LOY = ($cu && $prog['loyalty_enabled'] && (int)$cu['points'] > 0) ? ['points' => (int)$cu['points'], 'rp' => $prog['redeem_points'], 'rv' => $prog['redeem_value']] : null;
require APP_ROOT . '/includes/store-header.php';
?>
<div class="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
<h1 class="text-3xl font-black sm:text-4xl">إتمام الطلب</h1>
<p class="mt-2 text-[var(--text-faint)]">الدفع عند الاستلام · املأ بياناتك وسنتواصل معك للتأكيد.</p>
<?php if(!$cu):?><p class="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-dim)]">يمكنك إتمام الطلب كزائر، أو <a href="<?=e(url('account.php'))?>" class="font-bold text-[var(--accent)] hover:underline">سجّل دخولك</a> لتعبئة بياناتك تلقائياً وتتبع طلباتك.</p><?php endif;?>
<div id="empty-checkout" hidden class="mt-10 grid place-items-center rounded-3xl bg-[var(--card)] py-20 text-center"><p class="text-lg font-bold text-[var(--text-dim)]">لا توجد منتجات في السلة</p><a href="<?=e(url('products.php'))?>" class="mt-5 rounded-full bg-white px-8 py-3 font-bold text-black">تسوق الآن</a></div>
<form id="checkout-form" onsubmit="return submitOrder(event)" class="mt-10 grid gap-10 lg:grid-cols-5">
<div class="space-y-5 lg:col-span-3">
<?php $inputCls='w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3.5 text-white outline-none transition placeholder:text-[var(--text-dim)] placeholder:opacity-90 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20'; ?>
<div class="rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6"><h2 class="mb-5 flex items-center gap-2 text-lg font-extrabold text-white"><?=icon('user',19,'text-[var(--accent)]')?> بيانات المستلم</h2><div class="grid gap-4 sm:grid-cols-2">
<label class="block text-sm font-bold text-[var(--text)]">الاسم الكامل *<input id="f-name" required placeholder="مثال: محمد أحمد" value="<?=e($cu['name']??'')?>" class="mt-1.5 <?=$inputCls?>"></label>
<label class="block text-sm font-bold text-[var(--text)]">رقم الهاتف *<input id="f-phone" required dir="ltr" inputmode="tel" placeholder="09XXXXXXXX" value="<?=e($cu['phone']??'')?>" class="mt-1.5 text-left <?=$inputCls?>"></label>
<label class="block text-sm font-bold text-[var(--text)] sm:col-span-2">البريد الإلكتروني (اختياري، نرسل لك تأكيد الطلب وتحديثاته)<input id="f-email" type="email" dir="ltr" placeholder="name@example.com" value="<?=e($cu['email']??'')?>" class="mt-1.5 text-left <?=$inputCls?>"></label>
</div></div>
<div class="rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6"><h2 class="mb-5 flex items-center gap-2 text-lg font-extrabold text-white"><?=icon('map-pin',19,'text-[var(--accent)]')?> عنوان التوصيل</h2><div class="grid gap-4 sm:grid-cols-2">
<label class="block text-sm font-bold text-[var(--text)]">المدينة *<select id="f-city" required onchange="renderSummary()" class="mt-1.5 <?=$inputCls?>"><?php foreach($cities as $c):?><option value="<?=e($c['name'])?>" <?=($cu['city']??'')===$c['name']?'selected':''?>><?=e($c['name'].'، توصيل '.format_price($c['fee']))?></option><?php endforeach;?></select></label>
<label class="block text-sm font-bold text-[var(--text)]">العنوان بالتفصيل<input id="f-address" placeholder="الحي، الشارع، أقرب معلم" value="<?=e($cu['address']??'')?>" class="mt-1.5 <?=$inputCls?>"></label></div>
<label class="mt-4 block text-sm font-bold text-[var(--text)]"><span class="flex items-center gap-1.5"><?=icon('file-text',15)?> ملاحظات إضافية (اختياري)</span><textarea id="f-notes" rows="3" class="mt-1.5 resize-none <?=$inputCls?>" placeholder="أي تفاصيل تساعدنا في التوصيل"></textarea></label></div>
<div class="rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6"><h2 class="mb-4 flex items-center gap-2 text-lg font-extrabold text-white"><?=icon('ticket',19,'text-[var(--accent)]')?> كود الخصم</h2>
<p id="coupon-applied" class="hidden flex items-center justify-between rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400"><span id="coupon-label"></span><button type="button" onclick="removeCoupon()" class="text-xs text-[var(--text-dim)] hover:text-[var(--text)]">إزالة</button></p>
<div id="coupon-entry"><div class="flex gap-2"><input id="f-coupon" dir="ltr" placeholder="ISTORE10" class="min-w-0 flex-1 rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3 text-left text-white outline-none placeholder:text-[var(--text-dim)] placeholder:opacity-90 focus:border-[var(--accent)]"><button id="coupon-button" type="button" onclick="applyCoupon()" class="rounded-2xl bg-white px-6 py-3 text-sm font-bold text-black hover:bg-neutral-200 disabled:opacity-60">تطبيق</button></div><p id="coupon-msg" class="mt-2 text-xs font-bold text-red-400"></p></div></div>
<?php if($LOY):?><div class="rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6"><h2 class="mb-4 flex items-center gap-2 text-lg font-extrabold text-white"><?=icon('gift',19,'text-[var(--accent)]')?> نقاط الولاء</h2><p class="text-sm text-[var(--text-dim)]">رصيدك: <b class="text-white"><?=$LOY['points']?></b> نقطة (<?=$LOY['rp']?> نقطة = <?=e(format_price($LOY['rv']))?>)</p><label class="mt-3 flex items-center gap-3 text-sm font-bold"><input id="loyalty-toggle" type="checkbox" onchange="usePoints=this.checked;renderSummary()" class="h-4 w-4"><span id="loyalty-hint">استخدم نقاط الولاء المتاحة</span></label></div><?php endif;?>
<div class="rounded-3xl border border-[var(--border)] bg-white/[0.04] p-6"><h2 class="mb-4 flex items-center gap-2 text-lg font-extrabold text-white"><?=icon('banknote',19,'text-[var(--accent)]')?> طريقة الدفع</h2><div class="flex items-center gap-3 rounded-2xl border-2 border-[var(--accent)] bg-[var(--accent)]/10 p-4"><span class="grid h-11 w-11 place-items-center rounded-full bg-[var(--accent)] text-white"><?=icon('banknote',20)?></span><div><p class="font-bold text-white">الدفع عند الاستلام</p><p class="text-sm text-[var(--text-dim)]">ادفع نقداً عند وصول طلبك إليك</p></div></div></div>
</div>
<div class="lg:col-span-2"><div class="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 lg:sticky lg:top-24"><h2 class="text-lg font-extrabold text-white">طلبك (<span id="sum-count"></span>)</h2><ul id="sum-items" class="mt-4 max-h-72 space-y-3 overflow-y-auto pl-1"></ul>
<div class="mt-5 space-y-2.5 border-t border-[var(--border)] pt-4 text-sm"><div class="flex justify-between text-[var(--text-dim)]"><span>المجموع الفرعي</span><b id="sum-sub" class="text-white"></b></div><div id="sum-discount-row" class="hidden flex justify-between text-emerald-400"><span>الخصم</span><b id="sum-discount"></b></div><div id="sum-points-row" class="hidden flex justify-between text-emerald-400"><span>نقاط الولاء</span><b id="sum-points"></b></div><div class="flex justify-between text-[var(--text-dim)]"><span class="flex items-center gap-1"><?=icon('truck',14)?> التوصيل، <span id="sum-city"></span></span><b id="sum-fee" class="text-white"></b></div><p id="free-hint" hidden class="rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-400"></p></div>
<div class="mt-4 flex justify-between border-t border-[var(--border)] pt-4"><span class="text-lg font-bold text-white">الإجمالي</span><span id="sum-total" class="text-2xl font-black text-[var(--accent)]"></span></div><p id="sum-secondary" hidden class="mt-1 text-left text-sm font-bold text-[var(--text-dim)]"></p><p id="order-err" class="mt-4 hidden rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400"></p><button id="submit-btn" class="glow-btn mt-6 flex w-full items-center justify-center gap-2 rounded-full py-4 text-lg font-bold transition hover:brightness-110 disabled:opacity-60"><?=icon('banknote',20)?> تأكيد الطلب</button>
<?php if(setting('whatsapp')):?><a href="https://wa.me/<?=e(preg_replace('/\D/','',setting('whatsapp')))?>" target="_blank" rel="noreferrer" class="mt-3 block text-center text-sm font-bold text-emerald-400 hover:underline">أو اطلب مباشرة عبر واتساب</a><?php endif;?></div></div>
</form></div>
<script>
var CITIES = <?= json_encode(array_map(fn($c) => ['name' => $c['name'], 'fee' => (float)$c['fee']], $cities), JSON_UNESCAPED_UNICODE) ?>;
var FREE_THRESHOLD = <?= json_encode($threshold) ?>;
var discount = 0, couponCode = '', usePoints = false;
var LOY = <?= json_encode($LOY) ?>;
function pointsCalc() {
  if (!LOY || !usePoints) return { used: 0, disc: 0 };
  var blocks = Math.max(0, Math.min(Math.floor(LOY.points / LOY.rp), Math.floor((Cart.total() - discount) / LOY.rv)));
  return { used: blocks * LOY.rp, disc: blocks * LOY.rv };
}

function cityFee() {
  var sel = document.getElementById('f-city');if(!sel)return 0;
  var c = CITIES.find(function (x) { return x.name === sel.value; });
  var sub = Cart.total();
  if (FREE_THRESHOLD > 0 && sub - discount - pointsCalc().disc >= FREE_THRESHOLD) return 0;
  return c ? c.fee : 0;
}

function renderSummary() {
  var sub = Cart.total(), fee = cityFee(), pc = pointsCalc(), total = sub - discount - pc.disc + fee;
  var pr = document.getElementById('sum-points-row');
  if (pr) { pr.classList.toggle('hidden', pc.disc <= 0); document.getElementById('sum-points').textContent = '-' + window.fmtPrice(pc.disc); }
  document.getElementById('sum-sub').textContent = window.fmtPrice(sub);
  document.getElementById('sum-discount-row').classList.toggle('hidden', discount <= 0);
  document.getElementById('sum-discount').textContent = '-' + window.fmtPrice(discount);
  document.getElementById('sum-fee').textContent = fee === 0 ? 'مجاني' : window.fmtPrice(fee);
  document.getElementById('sum-total').textContent = window.fmtPrice(Math.max(total, 0));
  var second=<?=json_encode(['symbol'=>price_opts()['sym2'],'rate'=>price_opts()['rate2'],'pos'=>price_opts()['pos']],JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT)?>;var se=document.getElementById('sum-secondary');se.hidden=!(second.symbol&&second.rate);if(!se.hidden){var n=(Math.max(total,0)/second.rate).toLocaleString('ar-LY',{minimumFractionDigits:2,maximumFractionDigits:2});se.textContent=second.pos==='before'?'≈ '+second.symbol+' '+n:'≈ '+n+' '+second.symbol;}
  if(LOY){var blocks=Math.max(0,Math.min(Math.floor(LOY.points/LOY.rp),Math.floor((sub-discount)/LOY.rv))),toggle=document.getElementById('loyalty-toggle');toggle.disabled=blocks===0;document.getElementById('loyalty-hint').textContent=blocks?'استخدم '+blocks*LOY.rp+' نقطة واحصل على خصم '+window.fmtPrice(blocks*LOY.rv):'رصيدك لا يكفي للاستبدال بعد';}
  var items = document.getElementById('sum-items');
  document.getElementById('sum-count').textContent=Cart.items.length;
  document.getElementById('sum-city').textContent=document.getElementById('f-city').value||'اختر المدينة';
  var hint=document.getElementById('free-hint');hint.hidden=!(FREE_THRESHOLD>0&&sub<FREE_THRESHOLD);hint.textContent='أضف منتجات بقيمة '+window.fmtPrice(Math.max(0,FREE_THRESHOLD-sub))+' واحصل على شحن مجاني';
  items.innerHTML = Cart.items.map(function(i){return '<li class="flex items-center gap-3"><img src="'+window.safeImageUrl(i.image)+'" class="h-14 w-14 rounded-xl bg-[var(--surface-2)] object-cover" alt=""><div class="min-w-0 flex-1"><p class="line-clamp-1 text-sm font-bold text-[var(--text)]">'+window.escapeHtml(i.name)+'</p>'+(i.variant_label?'<p class="text-xs font-bold text-[var(--text-faint)]">'+window.escapeHtml(i.variant_label)+'</p>':'')+'<p class="text-xs text-[var(--text-faint)]">الكمية: '+i.qty+'</p></div><span class="text-sm font-bold text-white">'+window.escapeHtml(window.fmtPrice(i.price*i.qty))+'</span></li>';}).join('');

}

function removeCoupon(){discount=0;couponCode='';document.getElementById('f-coupon').value='';document.getElementById('coupon-applied').classList.add('hidden');document.getElementById('coupon-entry').classList.remove('hidden');renderSummary();}
async function applyCoupon(){var inp=document.getElementById('f-coupon'),msg=document.getElementById('coupon-msg'),btn=document.getElementById('coupon-button'),code=inp.value.trim();if(!code)return;btn.disabled=true;msg.textContent='';try{var r=await fetch(BASE+'/api/coupon-validate.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:code,subtotal:Cart.total()})}),d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'كود غير صالح');discount=d.discount;couponCode=code.toUpperCase();document.getElementById('coupon-label').textContent=couponCode+'، خصم '+window.fmtPrice(discount);document.getElementById('coupon-applied').classList.remove('hidden');document.getElementById('coupon-entry').classList.add('hidden');}catch(e){discount=0;couponCode='';msg.textContent=e.message||'تعذر الاتصال';}finally{btn.disabled=false;renderSummary();}}

function submitOrder(ev) {
  ev.preventDefault();
  var btn = document.getElementById('submit-btn'), err = document.getElementById('order-err');
  if(!/^[\d+\s-]{8,}$/.test(document.getElementById('f-phone').value.trim())){err.textContent='رقم الهاتف غير صحيح';err.classList.remove('hidden');return false;}
  btn.disabled = true; btn.textContent = 'جاري تأكيد الطلب…';
  err.classList.add('hidden');
  var body = {
    name: document.getElementById('f-name').value.trim(),
    phone: document.getElementById('f-phone').value.trim(),
    email: document.getElementById('f-email').value.trim(),
    city: document.getElementById('f-city').value,
    address: document.getElementById('f-address').value.trim(),
    notes: document.getElementById('f-notes').value.trim(),
    coupon: couponCode,
    use_points: usePoints,
    items: Cart.items.map(function (i) { return { id: i.id, qty: i.qty, variant_id: i.variant_id || 0 }; })
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
  if (!/^[\d+\s-]{8,}$/.test(phone) || !Cart.items.length) return;
  fetch(window.BASE + '/api/cart-lead.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phone, items: Cart.items, total: Cart.total() }) }).catch(function () {});
}


window.initCheckoutPage=function(){var empty=!Cart.items.length;document.getElementById('empty-checkout').hidden=!empty;document.getElementById('checkout-form').classList.toggle('hidden',empty);if(empty)return;renderSummary();var timer;document.getElementById('f-phone').addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(captureLead,1500)});};
</script>
<?php require APP_ROOT.'/includes/store-footer.php'; ?>
