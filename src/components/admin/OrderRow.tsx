"use client";
import React from "react";
import { useRouter } from "next/navigation";

// صف طلب قابل للنقر بالكامل — يتجاهل النقر على العناصر التفاعلية داخله (الحالة، الحذف، الروابط)
export default function OrderRow({ id, className, children }: { id: number; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr
      className={`cursor-pointer ${className || ""}`}
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t.closest("select,button,a,input,textarea")) return;
        router.push(`/admin/orders/${id}`);
      }}
    >
      {children}
    </tr>
  );
}
