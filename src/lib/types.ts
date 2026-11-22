export type Category = { id: number; name: string; slug: string; description: string; image: string; sort_order: number; active: number };
export type Brand = { id: number; name: string; slug: string; image: string; sort_order: number; active: number };
export type Product = {
  id: number; name: string; slug: string; category_id: number | null; description: string;
  price: number; old_price: number | null; stock: number; image: string; images: string;
  badge: string; featured: number; active: number; rating: number; created_at: string;
  brand_id: number | null;
  category_name?: string;
  brand_name?: string;
  brand_slug?: string;
};
export type Order = {
  id: number; code: string; customer_name: string; phone: string; city: string; address: string;
  notes: string; subtotal: number; discount: number; coupon_code: string; delivery_fee: number; total: number; status: string; created_at: string;
};
export type Coupon = { id: number; code: string; kind: "percent" | "fixed"; value: number; min_total: number; active: number; expires_at: string; created_at: string };
export type StockAlert = { id: number; product_id: number; contact: string; notified: number; created_at: string; product_name?: string };
export type Review = { id: number; product_id: number; customer_name: string; rating: number; comment: string; phone: string; order_code: string; approved: number; created_at: string; product_name?: string };
export type CartLead = { id: number; phone: string; items: string; total: number; reminded: number; created_at: string; updated_at: string };
export type Customer = { id: number; name: string; email: string; phone: string; created_at: string };
export type OrderItem = { id: number; order_id: number; product_id: number | null; name: string; price: number; qty: number };
export type City = { id: number; name: string; fee: number; active: number; sort_order: number };
export type HeroSlide = { id: number; title: string; subtitle: string; cta_text: string; cta_link: string; image: string; theme: string; sort_order: number; active: number };
export type Banner = { id: number; title: string; subtitle: string; image: string; link: string; sort_order: number; active: number };
