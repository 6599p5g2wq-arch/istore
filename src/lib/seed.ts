import type Database from "better-sqlite3";
import crypto from "crypto";

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

const DEFAULT_SETTINGS: Record<string, string> = {
  store_name: "آي ستور",
  site_url: "https://istore-vzrb.onrender.com",
  store_tagline: "وجهتك الأولى لإكسسوارات ومنتجات Apple الأصلية في ليبيا",
  announcement: "توصيل سريع لكل المدن الليبية — الدفع عند الاستلام",
  currency: "د.ل",
  phone: "+218910000000",
  whatsapp: "218910000000",
  email: "info@istore.ly",
  address: "طرابلس، ليبيا",
  working_hours: "السبت - الخميس: 10 صباحاً - 10 مساءً",
  about_text: "آي ستور متجر ليبي متخصص في إكسسوارات ومنتجات Apple الأصلية. نستورد منتجاتنا من مصادر موثوقة ونوفرها لك بأفضل الأسعار مع ضمان الجودة وخدمة توصيل تغطي كل المدن الليبية.",
  returns_policy: "يمكنك استبدال أو استرجاع المنتج خلال 7 أيام من الاستلام بحالته الأصلية، بشرط عدم فتح المنتجات المغلقة بالشعار الأصلي. عيوب المصنع مشمولة بالضمان.",
  delivery_policy: "نوصل لكل المدن الليبية خلال 24-72 ساعة حسب المدينة. الدفع عند الاستلام متاح لجميع الطلبات.",
  facebook: "https://facebook.com",
  instagram: "https://instagram.com",
  tiktok: "https://tiktok.com",
  footer_text: "جميع الحقوق محفوظة",
  free_shipping_threshold: "500",
};

const CATEGORIES = [
  { name: "أغطية وحماية", slug: "cases", description: "أغطية أصلية وعصرية لحماية آيفونك بأناقة", image: "/images/cat-cases.jpg", sort_order: 1 },
  { name: "شواحن وكابلات", slug: "chargers", description: "شواحن سريعة وكابلات أصلية معتمدة", image: "/images/cat-chargers.jpg", sort_order: 2 },
  { name: "السماعات", slug: "audio", description: "AirPods وسماعات Apple الأصلية", image: "/images/cat-audio.jpg", sort_order: 3 },
  { name: "Apple Watch وسوارات", slug: "watch", description: "ساعات Apple وسوارات بكل الألوان والخامات", image: "/images/cat-watch.jpg", sort_order: 4 },
  { name: "MagSafe", slug: "magsafe", description: "إكسسوارات MagSafe المغناطيسية الأصلية", image: "/images/cat-magsafe.jpg", sort_order: 5 },
  { name: "حماية الشاشة", slug: "protection", description: "زجاج حماية وأفلام شاشة بجودة عالية", image: "/images/cat-protection.jpg", sort_order: 6 },
  { name: "أجهزة Apple", slug: "devices", description: "iPhone وiPad وMacBook وأجهزة Apple الأصلية", image: "/images/cat-devices.jpg", sort_order: 7 },
];

// [name, slug, category_slug, description, price, old_price|null, stock, image, badge, featured]
const PRODUCTS: [string, string, string, string, number, number | null, number, string, string, number][] = [
  ["غطاء iPhone 16 Pro Max سيليكون أصلي MagSafe", "iphone-16-pro-max-silicone-case", "cases", "غطاء سيليكون أصلي من Apple مع دعم MagSafe كامل، بطانة مايكروفايبر ناعمة تحمي جهازك من الخدوش، وحواف مرتفعة لحماية الشاشة والكاميرا.", 245, 290, 25, "/images/p-silicone-case.jpg", "الأكثر مبيعاً", 1],
  ["غطاء iPhone 16 شفاف MagSafe أصلي", "iphone-16-clear-case", "cases", "غطاء شفاف رفيع من Apple يظهر تصميم جهازك الأصلي، مقاوم للاصفرار، مغناطيس MagSafe مدمج قوي.", 225, null, 30, "/images/p-clear-case.jpg", "", 0],
  ["غطاء جلد طبيعي فاخر iPhone 15 Pro", "leather-case-15-pro", "cases", "غطاء جلد طبيعي فاخر بملمس راقي، حماية كاملة للزوايا، متوفر بعدة ألوان كلاسيكية.", 320, 380, 12, "/images/p-leather-case.jpg", "خصم", 1],
  ["غطاء حماية عسكري مضاد للصدمات iPhone 16", "armor-case-16", "cases", "حماية بمعيار عسكري MIL-STD، طبقتان ماصتان للصدمات، مسند خلفي مدمج، حماية سقوط حتى 3 أمتار.", 145, null, 40, "/images/p-armor-case.jpg", "", 0],
  ["شاحن Apple أصلي 20W USB-C", "apple-20w-charger", "chargers", "محول طاقة Apple الأصلي بقوة 20W، يشحن آيفونك حتى 50% في 30 دقيقة، متوافق مع كل أجهزة USB-C.", 165, 195, 50, "/images/p-20w-charger.jpg", "الأكثر مبيعاً", 1],
  ["كابل Apple أصلي USB-C إلى USB-C مترين", "usbc-cable-2m", "chargers", "كابل شحن Apple الأصلي بطول مترين، يدعم الشحن السريع ونقل البيانات، خامة مضفرة متينة.", 145, null, 45, "/images/p-usbc-cable.jpg", "", 0],
  ["شاحن سيارة مزدوج 48W PD سريع", "car-charger-48w", "chargers", "شاحن سيارة بمنفذين USB-C وUSB-A بقوة 48W، شحن سريع PD لآيفونك أثناء القيادة.", 95, 120, 35, "/images/p-car-charger.jpg", "خصم", 0],
  ["باور بانك MagSafe مغناطيسي 10000mAh", "magsafe-powerbank", "chargers", "باور بانك مغناطيسي يلتصق بظهر آيفونك، سعة 10000mAh، شحن لاسلكي 15W وسلكي 20W، شاشة رقمية للبطارية.", 285, 340, 18, "/images/p-magsafe-powerbank.jpg", "جديد", 1],
  ["AirPods Pro 2 USB-C أصلية", "airpods-pro-2", "audio", "سماعات AirPods Pro الجيل الثاني بمنفذ USB-C، عزل ضوضاء نشط أقوى مرتين، صوت مكاني مخصص، مقاومة للماء والعرق IP54.", 1580, 1750, 10, "/images/p-airpods-pro.jpg", "الأكثر مبيعاً", 1],
  ["AirPods 4 مع عزل الضوضاء النشط", "airpods-4-anc", "audio", "أحدث سماعات Apple بتصميم مريح جديد، عزل ضوضاء نشط، صوت محسّن، علبة شحن USB-C لاسلكية.", 1150, null, 14, "/images/p-airpods-4.jpg", "جديد", 1],
  ["AirPods Max أصلية", "airpods-max", "audio", "سماعات رأس فاخرة من Apple، عزل ضوضاء احترافي، صوت مكاني مع تتبع الرأس، 20 ساعة تشغيل، تصميم ألمنيوم فاخر.", 3900, 4200, 4, "/images/p-airpods-max.jpg", "", 1],
  ["EarPods بمنفذ USB-C أصلية", "earpods-usbc", "audio", "سماعات Apple السلكية الأصلية بمنفذ USB-C، صوت واضح ومايكروفون مدمج، متوافقة مع آيفون 15 وما بعده.", 145, null, 60, "/images/p-earpods.jpg", "", 0],
  ["Apple Watch Series 10 GPS 46mm", "apple-watch-10-46", "watch", "أحدث ساعة Apple بشاشة أكبر وأرفع تصميم، تتبع صحي متقدم، مقاومة للماء 50 متر، شحن أسرع 30%.", 3450, null, 6, "/images/p-watch-10.jpg", "جديد", 1],
  ["Apple Watch SE 2024 GPS 44mm", "apple-watch-se-44", "watch", "ساعة Apple الذكية بأفضل قيمة، تتبع رياضي وصحي شامل، إشعارات ومكالمات، مقاومة للماء.", 1890, 2100, 8, "/images/p-watch-se.jpg", "خصم", 1],
  ["سوار Apple Watch رياضي سيليكون أصلي", "watch-sport-band", "watch", "سوار رياضي أصلي من فلوروإيلاستمر الناعم، مريح ومتين، متوفر بألوان متعددة ومقاسات 42-46mm.", 165, null, 40, "/images/p-sport-band.jpg", "", 0],
  ["سوار Apple Watch ميلانيز ستانلس ستيل", "watch-milanese-loop", "watch", "سوار ميلانيز من الستانلس ستيل المنسوج بإغلاق مغناطيسي، مظهر فاخر يناسب المناسبات الرسمية.", 240, 285, 15, "/images/p-milanese.jpg", "", 0],
  ["شاحن MagSafe لاسلكي أصلي 15W", "magsafe-charger", "magsafe", "شاحن MagSafe اللاسلكي الأصلي من Apple بقوة 15W، محاذاة مغناطيسية مثالية، كابل متر مدمج.", 265, 310, 22, "/images/p-magsafe-charger.jpg", "الأكثر مبيعاً", 1],
  ["محفظة جلد MagSafe أصلية مع Find My", "magsafe-wallet", "magsafe", "محفظة جلدية أنيقة تلتصق مغناطيسياً بظهر آيفونك، تتسع لثلاث بطاقات، تدعم تتبع Find My عند انفصالها.", 385, null, 9, "/images/p-magsafe-wallet.jpg", "", 0],
  ["حامل MagSafe للسيارة مغناطيسي قوي", "magsafe-car-mount", "magsafe", "حامل سيارة مغناطيسي ثابت على التكييف، دوران 360 درجة، مغناطيس N52 قوي يثبت جهازك حتى على الطرق الوعرة.", 85, 110, 30, "/images/p-car-mount.jpg", "خصم", 0],
  ["قاعدة شحن 3 في 1 MagSafe قابلة للطي", "3in1-charging-station", "magsafe", "قاعدة شحن واحدة لآيفون وساعة Apple وسماعات AirPods معاً، تصميم قابل للطي مثالي للسفر، شحن سريع 15W.", 340, 420, 16, "/images/p-3in1-station.jpg", "الأكثر مبيعاً", 1],
  ["زجاج حماية 9H شفاف iPhone 16 Pro Max", "glass-16-pro-max", "protection", "زجاج حماية بصلابة 9H مقاوم للخدش والكسر، شفافية 99.9% لا تؤثر على اللمس أو جودة الشاشة، تركيب سهل بدون فقاعات.", 55, 75, 80, "/images/p-glass.jpg", "", 0],
  ["زجاج حماية خصوصية iPhone 16", "privacy-glass-16", "protection", "زجاج حماية بخاصية الخصوصية يمنع المتطفلين من رؤية شاشتك من الجوانب، صلابة 9H وطبقة ضد البصمات.", 75, null, 55, "/images/p-privacy-glass.jpg", "", 0],
  ["واقي عدسات الكاميرا iPhone 16 Pro", "camera-lens-protector", "protection", "حلقات حماية فردية لعدسات الكاميرا من زجاج الياقوت، تحمي من الخدوش بدون التأثير على جودة التصوير.", 65, 85, 45, "/images/p-lens.jpg", "خصم", 0],
  ["iPhone 16 Pro Max 256GB", "iphone-16-pro-max-256", "devices", "أقوى آيفون على الإطلاق: شريحة A18 Pro، كاميرا 48MP مع زوم بصري 5x، هيكل تيتانيوم، زر التحكم بالكاميرا الجديد. ضمان سنة.", 9850, null, 5, "/images/p-iphone-16pm.jpg", "جديد", 1],
  ["iPhone 16 128GB", "iphone-16-128", "devices", "آيفون 16 بشريحة A18 وكاميرا مزدوجة 48MP وزر Action وDynamic Island. الأداء الاحترافي بالسعر الأذكى. ضمان سنة.", 7450, 7900, 7, "/images/p-iphone-16.jpg", "خصم", 1],
  ["iPad Air M2 11 بوصة 128GB WiFi", "ipad-air-m2", "devices", "آيباد Air بشريحة M2 الخارقة، شاشة Liquid Retina 11 بوصة، يدعم Apple Pencil Pro وMagic Keyboard. مثالي للعمل والدراسة.", 5250, null, 4, "/images/p-ipad-air.jpg", "", 1],
  ["MacBook Air M3 13 بوصة 8GB/256GB", "macbook-air-m3", "devices", "أرفع وأخف لابتوب من Apple بشريحة M3، بطارية 18 ساعة، شاشة Liquid Retina مذهلة، تصميم صامت بدون مروحة.", 8900, 9500, 3, "/images/p-macbook-air.jpg", "خصم", 1],
  ["AirTag قطعة واحدة", "airtag-1", "devices", "لا تضيع أغراضك بعد اليوم: AirTag يتتبع مفاتيحك وشنطك ومحفظتك بدقة عبر شبكة Find My العالمية، بطارية تدوم سنة.", 285, 330, 25, "/images/p-airtag.jpg", "الأكثر مبيعاً", 1],
  ["Apple Pencil Pro", "apple-pencil-pro", "devices", "قلم Apple الأحدث بمستشعر ضغط ودوران جديد، لمس haptic، إقران وشحن مغناطيسي. متوافق مع iPad Pro M4 وiPad Air M2.", 950, null, 8, "/images/p-pencil.jpg", "", 0],
  ["HomePod mini", "homepod-mini", "devices", "مكبر صوت ذكي بحجم صغير وصوت يملأ الغرفة، مساعد Siri مدمج، تحكم بالمنزل الذكي، تصميم أنيق بألوان رائعة.", 850, 920, 6, "/images/p-homepod.jpg", "", 0],
];

const CITIES: [string, number, number][] = [
  ["طرابلس", 10, 1], ["تاجوراء", 15, 2], ["جنزور", 15, 3], ["الزاوية", 15, 4], ["صرمان", 20, 5],
  ["صبراتة", 20, 6], ["الخمس", 15, 7], ["زليتن", 20, 8], ["مصراتة", 20, 9], ["ترهونة", 20, 10],
  ["بني وليد", 25, 11], ["غريان", 20, 12], ["الزنتان", 25, 13], ["سبها", 40, 14], ["سرت", 30, 15],
  ["أجدابيا", 30, 16], ["البريقة", 35, 17], ["بنغازي", 25, 18], ["المرج", 30, 19], ["البيضاء", 30, 20],
  ["درنة", 35, 21], ["طبرق", 40, 22], ["الكفرة", 50, 23], ["مرزق", 50, 24], ["أوباري", 50, 25], ["زوارة", 25, 26],
];

const HERO_SLIDES = [
  { title: "iPhone 16 Pro Max\nوصل حديثاً", subtitle: "شريحة A18 Pro وتصميم التيتانيوم — اقتنِه الآن مع ضمان سنة كاملة", cta_text: "اكتشف الآن", cta_link: "/product/iphone-16-pro-max-256", image: "/images/hero-1.jpg", theme: "dark", sort_order: 1 },
  { title: "AirPods Pro 2\nصوت يفوق الخيال", subtitle: "عزل ضوضاء نشط أقوى مرتين وصوت مكاني مخصص لك", cta_text: "تسوق السماعات", cta_link: "/product/airpods-pro-2", image: "/images/hero-2.jpg", theme: "dark", sort_order: 2 },
  { title: "كل إكسسوارات Apple الأصلية\nفي مكان واحد", subtitle: "شواحن، أغطية، ساعات وأكثر — توصيل سريع لباب بيتك والدفع عند الاستلام", cta_text: "تصفح المتجر", cta_link: "/products", image: "/images/hero-3.jpg", theme: "dark", sort_order: 3 },
];

const BANNERS = [
  { title: "شحن مجاني", subtitle: "للطلبات فوق 500 د.ل", image: "", link: "/products", sort_order: 1 },
  { title: "منتجات أصلية 100%", subtitle: "مع ضمان الاستبدال خلال 7 أيام", image: "", link: "/products", sort_order: 2 },
];

export function seedIfEmpty(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) AS c FROM settings").get() as { c: number }).c;
  if (count > 0) return;

  const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) insertSetting.run(k, v);

  const insertCat = db.prepare("INSERT INTO categories (name, slug, description, image, sort_order) VALUES (?, ?, ?, ?, ?)");
  const catIds: Record<string, number> = {};
  for (const c of CATEGORIES) {
    const r = insertCat.run(c.name, c.slug, c.description, c.image, c.sort_order);
    catIds[c.slug] = Number(r.lastInsertRowid);
  }

  const insertProduct = db.prepare(
    `INSERT INTO products (name, slug, category_id, description, price, old_price, stock, image, badge, featured, rating)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const ratings = [4.9, 4.8, 4.7, 5.0, 4.6];
  let i = 0;
  for (const [name, slug, cat, desc, price, oldPrice, stock, image, badge, featured] of PRODUCTS) {
    insertProduct.run(name, slug, catIds[cat], desc, price, oldPrice, stock, image, badge, featured, ratings[i % ratings.length]);
    i++;
  }

  const insertCity = db.prepare("INSERT INTO cities (name, fee, sort_order) VALUES (?, ?, ?)");
  for (const [name, fee, order] of CITIES) insertCity.run(name, fee, order);

  const insertSlide = db.prepare("INSERT INTO hero_slides (title, subtitle, cta_text, cta_link, image, theme, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)");
  for (const s of HERO_SLIDES) insertSlide.run(s.title, s.subtitle, s.cta_text, s.cta_link, s.image, s.theme, s.sort_order);

  const insertBanner = db.prepare("INSERT INTO banners (title, subtitle, image, link, sort_order) VALUES (?, ?, ?, ?, ?)");
  for (const b of BANNERS) insertBanner.run(b.title, b.subtitle, b.image, b.link, b.sort_order);

  const salt = crypto.randomBytes(16).toString("hex");
  db.prepare("INSERT INTO admin_users (username, pass_hash, salt) VALUES (?, ?, ?)").run("admin", hashPassword("admin123", salt), salt);
}
