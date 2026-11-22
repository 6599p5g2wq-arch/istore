import { chromium } from 'playwright';
const base = 'http://localhost:3100';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const shot = (name) => page.screenshot({ path: `/tmp/shots/${name}.png` });

await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await shot('01-home');
await page.evaluate(() => window.scrollTo(0, 1400));
await page.waitForTimeout(1200);
await shot('02-home-scroll');

await page.goto(base + '/products', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await shot('03-products');

await page.goto(base + '/product/iphone-16-pro-max-256', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await shot('04-product');

// add to cart + checkout
await page.goto(base + '/product/airpods-pro-2', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.getByText('أضف إلى السلة').first().click();
await page.waitForTimeout(1200);
await shot('05-cart-drawer');
await page.goto(base + '/checkout', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await shot('06-checkout');

// place a real test order
await page.getByPlaceholder('مثال: محمد أحمد').fill('اختبار النظام');
await page.getByPlaceholder('09XXXXXXXX').fill('0912345678');
await page.getByText('تأكيد الطلب').click();
await page.waitForTimeout(2500);
await shot('07-order-success');

// admin login
await page.goto(base + '/admin/login', { waitUntil: 'networkidle' });
await shot('08-admin-login');
await page.locator('input').first().fill('admin');
await page.locator('input[type=password]').fill('admin123');
await page.getByRole('button', { name: 'دخول' }).click();
await page.waitForTimeout(2500);
await shot('09-admin-dashboard');
await page.goto(base + '/admin/products', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await shot('10-admin-products');
await page.goto(base + '/admin/orders', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await shot('11-admin-orders');

// mobile viewport
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await shot('12-mobile-home');

await browser.close();
console.log('DONE');
