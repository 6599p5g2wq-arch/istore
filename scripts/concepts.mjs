import { chromium } from 'playwright';
const base = 'http://localhost:3100';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });

// ---------- Concept 1: Dark premium glassmorphism ----------
const darkCSS = `
  body { background: #07070d !important; color: #f2f2f7 !important; }
  header { background: rgba(10,10,18,.72) !important; backdrop-filter: blur(24px) !important; border-bottom: 1px solid rgba(255,255,255,.08) !important; }
  header nav a, header button { color: #d7d7e0 !important; }
  header a.font-extrabold { color: #fff !important; }
  div[class*="bg-[#f5f5f7]"], section div[class*="bg-[#f5f5f7]"] { background: rgba(255,255,255,.045) !important; backdrop-filter: blur(18px); border: 1px solid rgba(255,255,255,.09); }
  .group { background: rgba(255,255,255,.05) !important; border: 1px solid rgba(255,255,255,.1) !important; backdrop-filter: blur(18px); box-shadow: 0 8px 40px rgba(0,0,0,.5) !important; }
  .group h1, .group p, .group div, .group a { color: #f2f2f7 !important; }
  .group .text-neutral-400, .group .text-neutral-500 { color: #9a9aad !important; }
  h1, h2, h3 { color: #fff !important; }
  p, span.text-neutral-500, .text-neutral-600 { color: #b9b9c7 !important; }
  section:first-of-type > div { background: radial-gradient(ellipse at 30% 20%, #16162a 0%, #07070d 70%) !important; box-shadow: 0 0 120px rgba(0,113,227,.25), inset 0 0 80px rgba(122,60,255,.12) !important; border: 1px solid rgba(255,255,255,.08); }
  footer { background: #05050a !important; border-top: 1px solid rgba(255,255,255,.08) !important; }
  footer * { color: #b9b9c7 !important; }
  footer .bg-white { background: rgba(255,255,255,.07) !important; }
  a[class*="bg-gradient-to-l"] { background: linear-gradient(135deg, rgba(0,113,227,.35), rgba(122,60,255,.35)) !important; border: 1px solid rgba(255,255,255,.12) !important; }
  .animate-marquee { filter: brightness(.9); }
  div[class*="border-y"] { background: #0b0b14 !important; border-color: rgba(255,255,255,.07) !important; }
  div[class*="border-y"] span { color: #cfcfe0 !important; }
`;
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.addStyleTag({ content: darkCSS });
await page.waitForTimeout(2200);
await page.screenshot({ path: '/tmp/concepts/1-dark-hero.png' });
await page.evaluate(() => window.scrollTo(0, 1450));
await page.waitForTimeout(1300);
await page.screenshot({ path: '/tmp/concepts/1-dark-products.png' });

// ---------- Concept 2: 3D tilt product cards ----------
const tiltJS = `
  document.querySelectorAll('.group').forEach(card => {
    card.style.transformStyle = 'preserve-3d';
    card.style.transition = 'transform .18s ease-out, box-shadow .18s ease-out';
    const shine = document.createElement('div');
    shine.style.cssText = 'position:absolute;inset:0;pointer-events:none;border-radius:24px;opacity:0;transition:opacity .2s;background:radial-gradient(600px circle at var(--mx,50%) var(--my,50%), rgba(0,113,227,.14), transparent 45%);z-index:5';
    card.appendChild(shine);
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const rx = ((y / r.height) - .5) * -14, ry = ((x / r.width) - .5) * 14;
      card.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateZ(12px)';
      card.style.boxShadow = '0 30px 60px -12px rgba(0,60,160,.28)';
      shine.style.opacity = 1; shine.style.setProperty('--mx', x + 'px'); shine.style.setProperty('--my', y + 'px');
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.boxShadow = ''; shine.style.opacity = 0; });
  });
`;
await page.goto(base + '/products', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.evaluate(tiltJS);
// hover the 3rd card to show the tilt frozen mid-motion
const cards = await page.$$('.group');
if (cards[2]) {
  const box = await cards[2].boundingBox();
  await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.3, { steps: 8 });
}
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/concepts/2-tilt-cards.png' });

// ---------- Concept 3: Cinematic parallax hero ----------
const cinematicCSS = `
  section:first-of-type > div { border-radius: 0 !important; margin: 0 -16px; min-height: 92vh !important; }
  section:first-of-type h1 { font-size: 4.6rem !important; letter-spacing: -0.02em; }
  section:first-of-type { position: relative; }
  section:first-of-type::before { content:''; position:absolute; inset:0; background: radial-gradient(ellipse at 70% 30%, rgba(0,113,227,.35), transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(122,60,255,.3), transparent 55%); z-index:0; border-radius: 2rem; pointer-events:none; }
`;
const cinematicJS = `
  const hero = document.querySelector('section:first-of-type > div');
  const img = hero.querySelector('img');
  img.style.transition = 'transform .1s linear';
  img.style.transform = 'scale(1.15)';
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    img.style.transform = 'scale(' + (1.15 + y * 0.0006) + ') translateY(' + y * 0.28 + 'px)';
    hero.querySelector('h1').style.transform = 'translateY(' + y * -0.12 + 'px)';
    hero.querySelector('h1').style.transition = 'transform .1s linear';
  }, { passive: true });
`;
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.addStyleTag({ content: cinematicCSS });
await page.evaluate(cinematicJS);
await page.waitForTimeout(1800);
await page.screenshot({ path: '/tmp/concepts/3-cinematic-top.png' });
await page.evaluate(() => window.scrollTo(0, 260));
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/concepts/3-cinematic-scroll.png' });

// ---------- Concept 4: Interactive 3D product viewer mock ----------
const viewerJS = `
  const wrap = document.querySelector('.rounded-\\\\[2rem\\\\].bg-\\\\[\\\\#f5f5f7\\\\]') || document.querySelector('img[alt]')?.parentElement;
  const img = wrap.querySelector('img');
  wrap.style.perspective = '1100px'; wrap.style.cursor = 'grab';
  img.style.transition = 'transform .12s ease-out'; img.style.transformStyle = 'preserve-3d';
  const hint = document.createElement('div');
  hint.textContent = 'اسحب للتدوير 360°';
  hint.style.cssText = 'position:absolute;bottom:16px;right:16px;background:rgba(0,0,0,.75);color:#fff;padding:8px 16px;border-radius:99px;font-size:12px;font-weight:700;z-index:10;backdrop-filter:blur(8px)';
  wrap.style.position = 'relative'; wrap.appendChild(hint);
  let dragging = false, rx = 0, ry = 0;
  wrap.addEventListener('pointerdown', () => dragging = true);
  window.addEventListener('pointerup', () => dragging = false);
  wrap.addEventListener('pointermove', e => {
    if (!dragging) return;
    const r = wrap.getBoundingClientRect();
    ry = ((e.clientX - r.left) / r.width - .5) * 60;
    rx = ((e.clientY - r.top) / r.height - .5) * -35;
    img.style.transform = 'rotateY(' + ry + 'deg) rotateX(' + rx + 'deg) scale(1.06)';
    img.style.filter = 'drop-shadow(0 30px 40px rgba(0,0,0,.35))';
  });
  window.__viewer = { set: (x, y) => { img.style.transform = 'rotateY(' + y + 'deg) rotateX(' + x + 'deg) scale(1.06)'; img.style.filter = 'drop-shadow(0 30px 40px rgba(0,0,0,.35))'; } };
`;
await page.goto(base + '/product/airpods-pro-2', { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);
await page.evaluate(viewerJS);
await page.evaluate(() => window.__viewer ? window.__viewer.set(-12, 28) : null);
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/concepts/4-3d-viewer.png' });

await browser.close();
console.log('DONE');
