import type { EventInfo, Settings } from "@/types";

export const EVENT_ID = "probezhka-beginner";

export const defaultEvent: EventInfo = {
  id: EVENT_ID,
  name: "Пробежка по ИИ-шкам",
  event_type: "Beginner",
  format: "Online Workshop",
  date: "2026-09-19",
  time: "15:00",
  address: "По многочисленным просьбам теперь в онлайн.",
  capacity: 15,
  price: 10000,
  currency: "₸",
  organizers: "Таир + Тимур",
};

export const defaultSettings: Settings = {
  whatsapp_number: "87771732590",
  whatsapp_message_template:
    "Здравствуйте! Я зарегистрировался на “{event}”. Отправляю чек об оплате {price}.\n\nИмя: {name}\nТелефон: {phone}\nЗаявка: #{number}",
  ticket_message_template:
    "Оплата подтверждена ✅\n\nВы зарегистрированы на:\n\n{event_upper} — {type_upper}\n\n📅 {date}\n⏰ {time}\n\nВаш билет: {ticket_url}\n\nДо встречи!",
  payment_instructions: "Оплатите 10 000 ₸ и отправьте чек нам в WhatsApp.",
  kaspi_qr_key: null,
  kaspi_pay_link: null,
  qr_active: true,
  hero_image_key: null,
  cta_text: "Записаться",
  offline_paid_seats: 0,
  posthog_key: null,
  posthog_host: "https://eu.i.posthog.com",
  confirmation_text:
    "Отправьте чек в WhatsApp. После подтверждения оплаты мы пришлём ваш билет туда же.",
};

export const PAID_STATUSES = ["paid", "ticket_sent"] as const;
