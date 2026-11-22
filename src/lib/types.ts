export type Category = { id: number; name: string; slug: string; description: string; image: string; sort_order: number; active: number };
export type Product = {
  id: number; name: string; slug: string; category_id: number | null; description: string;
  price: number; old_price: number | null; stock: number; image: string; images: string;
  badge: string; featured: number; active: number; rating: number; created_at: string;
  category_name?: string;
};
export type Order = {
  id: number; code: string; customer_name: string; phone: string; city: string; address: string;
  notes: string; subtotal: number; delivery_fee: number; total: number; status: string; created_at: string;
};
export type OrderItem = { id: number; order_id: number; product_id: number | null; name: string; price: number; qty: number };
export type City = { id: number; name: string; fee: number; active: number; sort_order: number };
export type HeroSlide = { id: number; title: string; subtitle: string; cta_text: string; cta_link: string; image: string; theme: string; sort_order: number; active: number };
export type Banner = { id: number; title: string; subtitle: string; image: string; link: string; sort_order: number; active: number };
