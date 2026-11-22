"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => { await fetch("/api/account/logout", { method: "POST" }); router.refresh(); }}
      className="flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-5 py-2.5 text-sm font-bold text-[var(--text)] transition hover:bg-[var(--chip)]"
    >
      <LogOut size={15} /> خروج
    </button>
  );
}
