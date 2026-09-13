"use client";

import { useRouter } from "next/navigation";

export function AdminNav({ active }: { active: "leads" | "settings" }) {
  const router = useRouter();
  const link = (href: string, label: string, on: boolean) => (
    <a
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-bold ${on ? "bg-electric text-night" : "bg-white/5 hover:bg-white/10"}`}
    >
      {label}
    </a>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-night/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3">
        <span className="mr-2 font-display font-black italic">ПРОБЕЖКА · ADMIN</span>
        {link("/admin", "Заявки", active === "leads")}
        {link("/admin/settings", "Настройки", active === "settings")}
        <a href="/" target="_blank" className="rounded-full px-4 py-2 text-sm font-bold text-cyan hover:bg-white/5">
          Посмотреть лендинг ↗
        </a>
        <button
          type="button"
          className="ml-auto rounded-full px-4 py-2 text-sm text-mist hover:bg-white/5"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            router.push("/admin/login");
          }}
        >
          Выйти
        </button>
      </div>
    </header>
  );
}
