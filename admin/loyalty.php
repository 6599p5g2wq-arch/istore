<?php
require_once __DIR__ . '/_init.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') handle_program_post('loyalty.php');
$p = program();
admin_header('الولاء و VIP', 'loyalty.php');
?>
<div class="max-w-3xl">
  <h1 class="text-2xl font-black sm:text-3xl">الولاء و VIP</h1>
  <p class="mt-1 text-sm text-neutral-500">نقاط على الطلبات المكتملة يستبدلها الزبون بخصم، وشارة VIP لأفضل الزبائن</p>
  <?php admin_msg(); ?>
  <div class="mt-6 space-y-5">
    <?php program_panel('loyalty', 'نقاط الولاء', 'تُمنح النقاط عند تحويل الطلب إلى «تم التوصيل»، ويستبدلها الزبون عند إتمام الطلب.', $p['loyalty_enabled'], [
        ['loyalty_per_lyd', 'نقاط لكل 1 د.ل', 1, 0.01],
        ['loyalty_redeem_points', 'عدد النقاط للاستبدال', 100, 1],
        ['loyalty_redeem_value', 'قيمة الخصم (د.ل)', 5, 0.01],
    ]); ?>
    <?php program_panel('vip', 'زبون VIP', 'يُوسم الزبون تلقائياً عند بلوغ حد الإنفاق (طلبات غير ملغاة)، ويمكنك تفعيله أو إلغاءه يدوياً من صفحة الزبون.', $p['vip_enabled'], [
        ['vip_threshold', 'حد الإنفاق (د.ل)', 2000, 1],
    ]); ?>
  </div>
</div>
<?php admin_footer(); ?>
