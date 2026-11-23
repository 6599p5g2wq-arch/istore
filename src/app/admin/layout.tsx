import React from "react";
import type { Metadata } from "next";
import { logoIcons } from "@/lib/favicon";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "لوحة التحكم", icons: logoIcons() };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
