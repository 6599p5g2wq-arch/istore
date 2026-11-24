<?php
// Public page metadata. site_url is the canonical deployment setting, never an untrusted Host header.
$seoBase=rtrim(setting('site_url',''),'/');if(!filter_var($seoBase,FILTER_VALIDATE_URL)||!preg_match('#^https?://#i',$seoBase))$seoBase='';
$seoPath=parse_url($_SERVER['REQUEST_URI']??'/',PHP_URL_PATH)?:'/';
$seoQuery=[];if(basename($seoPath)==='product.php'&&isset($_GET['slug'])&&is_string($_GET['slug']))$seoQuery['slug']=$_GET['slug'];
if(basename($seoPath)==='products.php')foreach(['category','brand','offers']as $key)if(isset($_GET[$key])&&is_string($_GET[$key]))$seoQuery[$key]=$_GET[$key];
$seoUrl=$seoBase!==''?$seoBase.$seoPath.($seoQuery?'?'.http_build_query($seoQuery):''):'';
?>
<?php if($seoUrl):?><link rel="canonical" href="<?=e($seoUrl)?>"><?php endif;?>
<meta property="og:title" content="<?=e($title)?>"><meta property="og:description" content="<?=e($desc)?>"><meta property="og:type" content="website"><meta property="og:locale" content="ar_LY">
<?php if($seoUrl):?><meta property="og:url" content="<?=e($seoUrl)?>"><?php endif;?>
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="<?=e($title)?>"><meta name="twitter:description" content="<?=e($desc)?>">

<?php if(preg_match('#/(cart|checkout|account|wishlist|track|order-success)\.php$#',$seoPath)):?><meta name="robots" content="noindex, nofollow"><?php endif;?>
<?php if(isset($p)&&is_array($p)&&!empty($p['image'])):$ogImage=img_url($p['image']);if(!preg_match('#^https?://#',$ogImage)&&$seoBase)$ogImage=$seoBase.'/'.ltrim($ogImage,'/');?><meta property="og:image" content="<?=e($ogImage)?>"><?php endif;?>
