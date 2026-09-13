"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!data.ok) setError(data.message || "Ошибка входа");
      else router.push("/admin");
    } catch {
      setError("Нет соединения");
    } finally {
      setPending(false);
    }
  }

  const input =
    "mt-1.5 block min-h-12 w-full rounded-xl border border-white/15 bg-night px-4 text-white focus:border-cyan focus:outline-none";

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-white/10 bg-deep p-6">
        <h1 className="font-display text-2xl font-black">Вход в админку</h1>
        <label className="mt-5 block text-sm font-semibold">
          Email
          <input name="email" type="email" autoComplete="username" required className={input} />
        </label>
        <label className="mt-4 block text-sm font-semibold">
          Пароль
          <input name="password" type="password" autoComplete="current-password" required className={input} />
        </label>
        {error ? <p role="alert" className="mt-4 text-sm text-red-300">{error}</p> : null}
        <button disabled={pending} className="cta mt-5 min-h-12 w-full rounded-xl font-display font-black uppercase text-night disabled:opacity-60">
          {pending ? "Входим…" : "Войти"}
        </button>
      </form>
    </main>
  );
}
