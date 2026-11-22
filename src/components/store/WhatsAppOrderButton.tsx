import React from "react";
import { MessageCircle } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function WhatsAppOrderButton({ product, whatsapp, currency }: { product: Product; whatsapp: string; currency: string }) {
  if (!whatsapp) return null;
  const text = encodeURIComponent(`مرحباً، أريد طلب: ${product.name} — ${formatPrice(product.price, currency)}`);
  return (
    <a
      href={`https://wa.me/${whatsapp}?text=${text}`}
      target="_blank"
      rel="noreferrer"
      className="mt-3 flex items-center justify-center gap-2 rounded-full bg-emerald-500 py-4 font-bold text-white shadow-lg transition hover:bg-emerald-600"
    >
      <MessageCircle size={19} /> اطلب عبر واتساب
    </a>
  );
}
