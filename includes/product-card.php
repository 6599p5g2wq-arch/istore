<?php
// بطاقة منتج موحدة — تُستخدم في كل صفحات المتجر
function product_card(array $p, int $index = 0): string {
    $out = ((int)$p['stock'] <= 0);
    $old = $p['old_price'] !== null && $p['old_price'] !== '' && (float)$p['old_price'] > (float)$p['price'] ? (float)$p['old_price'] : null;
    $badgeCls = $p['badge'] === 'خصم' ? 'bg-red-500' : ($p['badge'] === 'جديد' ? 'bg-emerald-500' : 'bg-[var(--accent)]');
    $delay = min($index * 0.05, 0.35);
    $jsData = e(json_encode([
        'id' => (int)$p['id'], 'name' => $p['name'], 'price' => (float)$p['price'],
        'image' => img_url($p['image']), 'slug' => $p['slug'], 'stock' => (int)$p['stock'],
    ], JSON_UNESCAPED_UNICODE));
    ob_start(); ?>
<div class="reveal" style="transition-delay:<?= $delay ?>s">
  <div class="tilt group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] glass-card shadow-[0_10px_36px_rgba(0,0,0,.4)] hover:border-white/25 hover:shadow-[0_28px_60px_-14px_rgba(0,113,227,.45)]">
    <a href="<?= e(url('product.php?slug=' . $p['slug'])) ?>" class="relative block aspect-square overflow-hidden bg-[var(--surface-2)]">
      <img src="<?= e(img_url($p['image'])) ?>" alt="<?= e($p['name']) ?>" loading="lazy" class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110">
      <?php if ($p['badge']): ?><span class="absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold text-white shadow <?= $badgeCls ?>"><?= e($p['badge']) ?></span><?php endif; ?>
      <?php if ($old): ?><span class="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-black">-<?= round((1 - $p['price'] / $old) * 100) ?>%</span><?php endif; ?>
      <button onclick="event.preventDefault();Wish.toggle(<?= htmlspecialchars(json_encode(['id' => (int)$p['id']]), ENT_QUOTES) ?>)" data-wish-btn="<?= (int)$p['id'] ?>" aria-label="المفضلة" class="absolute bottom-3 left-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition-opacity duration-300 hover:bg-black/60 group-hover:opacity-100"><?= icon('heart', 16) ?></button>
    </a>
    <div class="flex flex-1 flex-col p-4">
      <div class="mb-1 flex items-center gap-1 text-xs text-amber-400">
        <?= icon('star', 13, 'fill-current') ?>
        <span class="font-bold"><?= number_format((float)$p['rating'], 1) ?></span>
        <?php if (!empty($p['category_name'])): ?><span class="mr-auto text-[var(--text-faint)]"><?= e($p['category_name']) ?></span><?php endif; ?>
      </div>
      <a href="<?= e(url('product.php?slug=' . $p['slug'])) ?>" class="line-clamp-2 min-h-[2.6rem] text-sm font-semibold leading-snug text-[var(--text)] transition-colors hover:text-[var(--accent)]"><?= e($p['name']) ?></a>
      <div class="mt-3 flex items-end justify-between gap-2">
        <div>
          <div class="text-lg font-extrabold text-white"><?= e(format_price($p['price'])) ?></div>
          <?php if ($old): ?><div class="text-xs text-[var(--text-faint)] line-through"><?= e(format_price($old)) ?></div><?php endif; ?>
        </div>
        <button <?= $out ? 'disabled' : '' ?> onclick='Cart.add(<?= $jsData ?>)' aria-label="أضف إلى السلة"
          class="grid h-11 w-11 place-items-center rounded-full shadow-md transition <?= $out ? 'cursor-not-allowed bg-[var(--chip)] text-neutral-600' : 'bg-[var(--text)] text-[var(--bg)] hover:bg-[var(--accent)] hover:text-white active:scale-90' ?>">
          <?= icon('shopping-bag', 18) ?>
        </button>
      </div>
      <?php if ($out): ?><p class="mt-2 text-xs font-bold text-red-400">نفدت الكمية</p>
      <?php elseif ((int)$p['stock'] <= 5): ?><p class="mt-2 text-xs font-bold text-orange-400">باقي <?= (int)$p['stock'] ?> فقط</p><?php endif; ?>
    </div>
  </div>
</div>
<?php return ob_get_clean();
}
