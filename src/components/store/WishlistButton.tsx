"use client";
import React from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useWishlist, type WishItem } from "./WishlistContext";

export default function WishlistButton({ product, className = "" }: { product: WishItem; className?: string }) {
  const { has, toggle } = useWishlist();
  const active = has(product.id);
  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product); }}
      aria-label={active ? "أزل من المفضلة" : "أضف إلى المفضلة"}
      className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur transition ${active ? "bg-red-500 text-white" : "bg-black/40 text-white hover:bg-black/60"} ${className}`}
    >
      <Heart size={17} fill={active ? "currentColor" : "none"} />
    </motion.button>
  );
}
