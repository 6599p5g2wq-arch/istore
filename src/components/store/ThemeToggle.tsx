"use client";
import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [light, setLight] = useState<boolean | null>(null);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try { localStorage.setItem("theme", next ? "light" : "dark"); } catch { /* private mode */ }
  };

  return (
    <button
      onClick={toggle}
      aria-label={light ? "الوضع الليلي" : "الوضع النهاري"}
      title={light ? "الوضع الليلي" : "الوضع النهاري"}
      className="grid h-10 w-10 place-items-center rounded-full text-[var(--text)] transition-colors hover:bg-[var(--chip)]"
    >
      {light === null ? <span className="h-5 w-5" /> : light ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
