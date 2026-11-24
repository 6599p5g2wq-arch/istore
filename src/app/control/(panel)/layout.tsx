import React from "react";
import SessionGuard from "@/components/admin/SessionGuard";
import {authConfig} from "@/lib/security";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getControlSession } from "@/lib/control-auth";
import { getSettings } from "@/lib/settings";
import ControlLogout from "@/components/control/ControlLogout";
import { SlidersHorizontal, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ControlPanelLayout({ children }: { children: React.ReactNode }) {
  if (!getControlSession()) redirect("/control/login");
  const s = getSettings();
  return (
    <div className="light-scope min-h-screen bg-[#f5f5f7]"><SessionGuard panel="control" idleMinutes={authConfig().idleMinutes}/>
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2.5 font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-black text-white"><SlidersHorizontal size={17} /></span>
            إعدادات موقع {s.store_name}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold transition hover:bg-neutral-100">
              <ExternalLink size={14} /> عرض المتجر
            </Link>
            <ControlLogout />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
    </div>
  );
}
