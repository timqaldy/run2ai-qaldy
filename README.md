# Пробежка по ИИ-шкам — лендинг и воронка продаж

Прод: https://run2ai.qaldy.com · Админка: https://run2ai.qaldy.com/admin

Воронка: Лендинг → заявка (имя + WhatsApp) → Kaspi QR → чек в WhatsApp → администратор подтверждает оплату → билет → ссылка на билет в WhatsApp.

> **Kaspi QR — только способ оплаты.** Интеграции с банковским API нет. Оплата подтверждается администратором вручную по чеку, присланному в WhatsApp. Кнопка «Отправить билет в WhatsApp» открывает чат с готовым текстом — сообщение отправляет человек.

## Стек

Next.js 16 (App Router, TypeScript, Tailwind 4) · Cloudflare Workers через OpenNext · хранилище через адаптер:

1. **Supabase** (Postgres + Storage) — если заданы `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`
2. **Cloudflare D1 + R2** — биндинги `DB` и `FILES` (используется на проде)
3. **Локальный JSON** в `.data/` — для `npm run dev` без облака

## Запуск локально

```bash
npm install
cp .env.example .env.local   # задайте ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET (32+ символа)
npm run dev
```

Проверки: `npm run typecheck`, `npm run lint`, `npm run build`.

## ENV

| Переменная | Где | Назначение |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | build + runtime | Домен для ссылок на билеты |
| `ADMIN_EMAIL` | runtime var | Логин админки |
| `ADMIN_PASSWORD` | **secret** | Пароль админки |
| `SESSION_SECRET` | **secret** | Подпись сессии (32+ символа) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | secret, опционально | Supabase вместо D1/R2 |
| `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | build, опционально | Аналитика |

Смена пароля на проде: `npx wrangler secret put ADMIN_PASSWORD`.

## База данных

- D1: `migrations/0001_init.sql` → `npx wrangler d1 migrations apply run2ai-registrations --remote`
- Supabase: `supabase/migrations/0001_init.sql` (таблицы `events`, `registrations`, `tickets`, `settings`, `testimonials`, бакет `uploads`, seed события)

## Деплой (Cloudflare)

```bash
npm run deploy
```

На Windows путь с кириллицей ломает `fs.cpSync` в Node 24 во время сборки OpenNext. Собирайте из пути без кириллицы (например, в WSL) или используйте Node 22.

## Статусы заявки

`new` → `waiting_payment` (открыт экран оплаты) → `receipt_received` (вручную) → `paid` (создаётся билет) → `ticket_sent`. Также `waitlist` и `cancelled`. Места считаются только по `paid` и `ticket_sent`.

## Аналитика

Клиент: `page_view`, `cta_click`, `registration_started`, `registration_completed`, `payment_screen_opened`, `whatsapp_receipt_click` → `dataLayer`, GA4, Meta Pixel.
Сервер: `payment_confirmed`, `ticket_sent` пишутся структурированным логом (`lib/service.ts → trackServer`), туда же подключается GA4 Measurement Protocol.

## Что подключить для продакшена

- Загрузить реальный Kaspi QR: Админка → Настройки → Оплата
- WhatsApp Business Cloud API — реализовать `TicketDelivery` в `lib/messaging.ts`
- GA4 / Meta Pixel ID
- Юридически проверенный текст согласия на обработку данных (`/privacy`)
