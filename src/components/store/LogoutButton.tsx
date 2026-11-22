"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => { await fetch("/api/account/logout", { method: "POST" }); router.refresh(); }}
      className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-neutral-200 transition hover:bg-white/10"
    >
      <LogOut size={15} /> خروج
    </button>
  );
}
