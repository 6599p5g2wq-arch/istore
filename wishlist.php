<?php
require __DIR__.'/includes/bootstrap.php';require APP_ROOT.'/includes/auth.php';require APP_ROOT.'/includes/icons.php';
$page_title='المفضلة';require APP_ROOT.'/includes/store-header.php';?>
<div class="mx-auto max-w-7xl px-4 pt-10 sm:px-6"><h1 class="text-3xl font-black text-white sm:text-4xl">قائمة المفضلة</h1><div id="wish-root"></div></div>
<template id="empty-wishlist"><div class="mt-10 grid place-items-center rounded-3xl bg-[var(--card)] py-24 text-center"><?=icon('heart',56,'text-neutral-600')?><p class="mt-4 text-lg font-bold text-[var(--text-dim)]">مفضلتك فارغة</p><p class="mt-1 text-sm text-[var(--text-faint)]">اضغط على القلب في أي منتج لحفظه هنا</p><a href="<?=e(url('products.php'))?>" class="mt-6 rounded-full bg-white px-8 py-3 font-bold text-black transition-colors hover:bg-neutral-200">تصفح المنتجات</a></div></template>
<script>
window.WISH_CARDS={};var wishCtl=null,wishSeq=0;
window.renderWishlistPage=function(){var r=document.getElementById('wish-root'),ids=Wish.ids.slice();Wish.renderBadge();var draw=function(){var cards=ids.map(function(id){return window.WISH_CARDS[id];}).filter(Boolean);r.innerHTML=cards.length?'<div class="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">'+cards.join('')+'</div>':document.getElementById('empty-wishlist').innerHTML;r.querySelectorAll('.reveal').forEach(function(e){e.classList.add('in');});};if(!ids.length){window.WISH_CARDS={};draw();return;}if(wishCtl)wishCtl.abort();wishCtl=new AbortController();var seq=++wishSeq;fetch(window.BASE+'/api/wishlist-products.php?ids='+ids.join(','),{signal:wishCtl.signal}).then(function(x){if(!x.ok)throw Error();return x.json();}).then(function(d){if(seq!==wishSeq)return;window.WISH_CARDS=d.cards||{};draw();}).catch(function(e){if(e.name!=='AbortError'&&seq===wishSeq)draw();});};
</script>
<?php require APP_ROOT.'/includes/store-footer.php';?>
