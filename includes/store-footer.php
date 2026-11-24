<?php
$s = settings();
$cats = categories();
$year = date('Y');
?>
<footer class="on-dark mt-24 border-t border-white/10 bg-[#140b30]">
  <div class="mx-auto max-w-7xl px-4 py-14 sm:px-6">
    <div class="grid gap-10 md:grid-cols-4">
      <div>
        <div class="flex items-center gap-2 text-xl font-extrabold text-white">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-white text-black"><?= icon('store', 20) ?></span>
          <?= e($s['store_name'] ?? 'آي ستور') ?>
        </div>
        <p class="mt-4 text-sm leading-7 text-neutral-400"><?= e($s['store_tagline'] ?? '') ?></p>
        <div class="mt-5 flex gap-2">
          <?php if (!empty($s['facebook'])): ?><a href="<?= e(safe_nav_url($s['facebook'])) ?>" target="_blank" rel="noreferrer" aria-label="فيسبوك" class="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-neutral-300 transition hover:-translate-y-0.5 hover:bg-white/20 hover:text-white"><?= icon('facebook', 18) ?></a><?php endif; ?>
          <?php if (!empty($s['instagram'])): ?><a href="<?= e(safe_nav_url($s['instagram'])) ?>" target="_blank" rel="noreferrer" aria-label="انستغرام" class="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-neutral-300 transition hover:-translate-y-0.5 hover:bg-white/20 hover:text-white"><?= icon('instagram', 18) ?></a><?php endif; ?>
          <?php if (!empty($s['tiktok'])): ?><a href="<?= e(safe_nav_url($s['tiktok'])) ?>" target="_blank" rel="noreferrer" aria-label="تيك توك" class="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-neutral-300 transition hover:-translate-y-0.5 hover:bg-white/20 hover:text-white"><?= icon('music', 18) ?></a><?php endif; ?>
          <?php if (!empty($s['map_url'])): ?><a href="<?= e(safe_nav_url($s['map_url'])) ?>" target="_blank" rel="noreferrer" aria-label="موقع المحل على الخريطة" title="موقع المحل على الخريطة" class="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-neutral-300 transition hover:-translate-y-0.5 hover:bg-white/20 hover:text-white"><?= icon('map-pin', 18) ?></a><?php endif; ?>
        </div>
      </div>
      <div>
        <h3 class="mb-4 font-bold text-white">التصنيفات</h3>
        <ul class="space-y-2.5 text-sm text-neutral-400">
          <?php foreach ($cats as $c): ?><li><a class="transition-colors hover:text-white" href="<?= e(url('products.php?category=' . $c['slug'])) ?>"><?= e($c['name']) ?></a></li><?php endforeach; ?>
        </ul>
      </div>
      <div>
        <h3 class="mb-4 font-bold text-white">روابط سريعة</h3>
        <ul class="space-y-2.5 text-sm text-neutral-400">
          <li><a class="transition-colors hover:text-white" href="<?= e(url('products.php')) ?>">كل المنتجات</a></li>
          <li><a class="transition-colors hover:text-white" href="<?= e(url('track.php')) ?>">تتبع طلبك</a></li>
          <li><a class="transition-colors hover:text-white" href="<?= e(url('cart.php')) ?>">سلة التسوق</a></li>
          <li><a class="transition-colors hover:text-white" href="<?= e(url('about.php')) ?>">من نحن</a></li>
        </ul>
      </div>
      <div>
        <h3 class="mb-4 font-bold text-white">تواصل معنا</h3>
        <ul class="space-y-3 text-sm text-neutral-400">
          <li class="flex items-center gap-2.5"><span class="text-[var(--accent)]"><?= icon('phone', 16) ?></span><span dir="ltr"><?= e($s['phone'] ?? '') ?></span></li>
          <li class="flex items-center gap-2.5"><span class="text-[var(--accent)]"><?= icon('mail', 16) ?></span><?= e($s['email'] ?? '') ?></li>
          <li class="flex items-center gap-2.5"><span class="text-[var(--accent)]"><?= icon('map-pin', 16) ?></span><?= e($s['address'] ?? '') ?></li>
          <li class="flex items-center gap-2.5"><span class="text-[var(--accent)]"><?= icon('clock', 16) ?></span><?= e($s['working_hours'] ?? '') ?></li>
        </ul>
      </div>
    </div>
    <div class="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-neutral-500 sm:flex-row">
      <p>© <?= $year ?> <?= e($s['store_name'] ?? '') ?> — <?= e($s['footer_text'] ?? '') ?></p>
      <p>الدفع عند الاستلام متاح لكل المدن الليبية</p>
    </div>
  </div>
</footer>

<button id="back-to-top" aria-label="العودة للأعلى" class="glow-btn fixed bottom-6 left-6 z-40 grid h-12 w-12 place-items-center rounded-full shadow-xl">
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
</button>

<script src="<?= e(url('assets/js/app.js')) ?>"></script>
</body>
</html>
