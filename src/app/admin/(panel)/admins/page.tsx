import React from "react";
import { getSessionAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import AdminsManager from "@/components/admin/AdminsManager";

export const dynamic = "force-dynamic";

export default async function AdminAdmins() {
  const admins = getDb().prepare("SELECT id, username, created_at FROM admin_users ORDER BY id").all() as { id: number; username: string; created_at: string }[];
  return (
    <div>
      <h1 className="text-2xl font-black sm:text-3xl">المشرفون</h1>
      <p className="mt-1 text-sm text-neutral-500">حسابات الدخول للوحة التحكم — غيّر كلمة المرور الافتراضية فوراً</p>
      <AdminsManager admins={admins} currentId={(await getSessionAdmin())?.id || 0} />
    </div>
  );
}
