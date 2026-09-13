import { z } from "zod";
import { isValidPhone } from "@/lib/phone";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Введите имя").max(80, "Слишком длинное имя"),
  phone: z
    .string()
    .trim()
    .max(32)
    .refine(isValidPhone, "Проверьте номер телефона"),
  occupation: optionalText(120),
  consent: z.literal(true, { error: "Нужно согласие на обработку данных" }),
  website: z.string().max(0).optional(),
  utm_source: optionalText(120),
  utm_medium: optionalText(120),
  utm_campaign: optionalText(120),
  referrer: optionalText(300),
});

export const publicEventSchema = z.object({
  token: z.string().min(20).max(80),
  event: z.enum(["payment_screen_opened", "whatsapp_receipt_click"]),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(1).max(200),
});

export const STATUSES = [
  "new",
  "waiting_payment",
  "receipt_received",
  "paid",
  "ticket_sent",
  "waitlist",
  "cancelled",
] as const;

export const adminActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_status"), status: z.enum(STATUSES) }),
  z.object({ action: z.literal("confirm_payment") }),
  z.object({ action: z.literal("mark_ticket_sent") }),
  z.object({ action: z.literal("save_notes"), notes: z.string().max(2000) }),
]);

const time = z.string().regex(/^\d{2}:\d{2}$/, "Время в формате ЧЧ:ММ");

export const settingsSchema = z.object({
  event: z.object({
    name: z.string().trim().min(2).max(120),
    event_type: z.string().trim().min(1).max(60),
    format: z.string().trim().max(160),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата в формате ГГГГ-ММ-ДД"),
    time,
    address: z.string().trim().min(1).max(200),
    capacity: z.coerce.number().int().min(1).max(10000),
    price: z.coerce.number().int().min(0).max(100_000_000),
    currency: z.string().trim().min(1).max(8),
    organizers: z.string().trim().max(120),
  }),
  settings: z.object({
    whatsapp_number: z.string().trim().refine(isValidPhone, "Проверьте номер WhatsApp"),
    whatsapp_message_template: z.string().trim().min(5).max(1500),
    ticket_message_template: z.string().trim().min(5).max(1500),
    payment_instructions: z.string().trim().max(500),
    qr_active: z.boolean(),
    cta_text: z.string().trim().min(2).max(40),
    confirmation_text: z.string().trim().min(5).max(500),
  }),
});

export const testimonialSchema = z.object({
  id: z.string().max(60).optional(),
  name: z.string().trim().min(1).max(80),
  quote: z.string().trim().min(3).max(600),
  rating: z.coerce.number().int().min(1).max(5),
  published: z.boolean(),
  photo_key: z.string().max(200).nullable().optional(),
});

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message || "Проверьте данные";
}
