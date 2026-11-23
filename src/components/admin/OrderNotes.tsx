"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// ملاحظات داخلية للأدمن على الطلب — لا يراها العميل
export default function OrderNotes({ id, initial }: { id: number; initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  const save = async () => {
    setState("saving");
    const r = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: value }),
    });
    setState(r.ok ? "saved" : "idle");
    if (r.ok) {
      router.refresh();
      setTimeout(() => setState("idle"), 2000);
    }
  };

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => { setValue(e.target.value); setState("idle"); }}
        rows={3}
        maxLength={2000}
        placeholder="مثال: اتصل به بعد السادسة مساءً…"
        className="w-full rounded-2xl border border-neutral-200 bg-[#f5f5f7] p-3 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white"
      />
      <div className="mt-2 flex items-center gap-3">
        <button onClick={save} disabled={state === "saving"}
          className="rounded-full bg-neutral-900 px-5 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50">
          {state === "saving" ? <Loader2 size={14} className="animate-spin" /> : "حفظ الملاحظة"}
        </button>
        {state === "saved" && <span className="text-xs font-bold text-emerald-600">تم الحفظ ✓</span>}
      </div>
    </div>
  );
}
