<?php
require __DIR__.'/includes/bootstrap.php';header('Content-Type: application/xml; charset=utf-8');$base=rtrim(setting('site_url',''),'/');if(!filter_var($base,FILTER_VALIDATE_URL)||!preg_match('#^https?://#i',$base))$base='';if(!$base){http_response_code(503);echo '<?xml version="1.0" encoding="UTF-8"?><error>Configure site_url</error>';exit;}
$esc=fn($v)=>htmlspecialchars((string)$v,ENT_XML1|ENT_QUOTES,'UTF-8');
echo '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
$emit=function($path,$freq,$priority)use($base,$esc){echo '<url><loc>'.$esc($base.$path).'</loc><changefreq>'.$freq.'</changefreq><priority>'.$priority.'</priority></url>';};
foreach([['/','daily','1'],['/products.php','daily','0.9'],['/about.php','monthly','0.4']]as $r)$emit(...$r);
foreach(qall('SELECT slug FROM categories WHERE active=1')as $c)$emit('/products.php?category='.rawurlencode($c['slug']),'weekly','0.7');
foreach(qall('SELECT slug FROM products WHERE active=1')as $p)$emit('/product.php?slug='.rawurlencode($p['slug']),'weekly','0.8');echo '</urlset>';
