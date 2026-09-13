import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Обработка персональных данных — Пробежка по ИИ-шкам" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed text-mist">
      <Link href="/" className="text-sm text-cyan underline">
        ← На главную
      </Link>
      <h1 className="mt-6 font-display text-3xl font-black text-white">Согласие на обработку данных</h1>
      <p className="mt-4">
        Оставляя заявку, вы соглашаетесь, что организаторы мероприятия «Пробежка по ИИ-шкам» (QALDY AI) обрабатывают
        указанные вами имя, номер телефона / WhatsApp и род занятий.
      </p>
      <p className="mt-4">
        Данные используются только для связи по вашей заявке: подтверждения оплаты, отправки билета и информации о
        мероприятии. Мы не передаём их третьим лицам, кроме случаев, предусмотренных законом.
      </p>
      <p className="mt-4">
        Для улучшения сайта мы используем обезличенную аналитику посещений (PostHog). В неё не передаются имя и номер
        телефона.
      </p>
      <p className="mt-4">
        Чтобы изменить или удалить свои данные, напишите организаторам в WhatsApp, указанный на сайте.
      </p>
    </main>
  );
}
