import React from "react";
import { Wrench } from "lucide-react";

export default function Maintenance({ name, message }: { name: string; message: string }) {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-white/10"><Wrench size={36} /></div>
        <h1 className="mt-6 text-3xl font-black">{name}</h1>
        <p className="mt-3 text-lg leading-8 text-[var(--text-dim)]">{message}</p>
      </div>
    </div>
  );
}
