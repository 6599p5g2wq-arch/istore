"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function ControlLogout() {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/control/logout", { method: "POST" });
    router.replace("/control/login");
    router.refresh();
  };
  return (
    <button onClick={logout} className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-neutral-700">
      <LogOut size={14} /> خروج
    </button>
  );
}
