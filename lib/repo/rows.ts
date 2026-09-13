import { defaultEvent, defaultSettings } from "@/lib/defaults";
import type { EventInfo, Registration, Settings, Testimonial, Ticket } from "@/types";

type Row = Record<string, unknown>;

const str = (v: unknown) => (v === null || v === undefined ? null : String(v));

export function eventFromRow(row: Row | null): EventInfo {
  if (!row) return defaultEvent;
  return {
    id: String(row.id),
    name: String(row.name),
    event_type: String(row.event_type),
    format: String(row.format ?? defaultEvent.format),
    date: String(row.date),
    time: String(row.time),
    address: String(row.address),
    capacity: Number(row.capacity),
    price: Number(row.price),
    currency: String(row.currency),
    organizers: String(row.organizers ?? defaultEvent.organizers),
  };
}

export function settingsFromValue(value: unknown): Settings {
  const parsed = typeof value === "string" ? (JSON.parse(value) as Partial<Settings>) : value;
  return { ...defaultSettings, ...((parsed as Partial<Settings>) ?? {}) };
}

export function registrationFromRow(row: Row): Registration {
  return {
    id: String(row.id),
    number: String(row.number),
    access_token: String(row.access_token),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    name: String(row.name),
    phone: String(row.phone),
    whatsapp: String(row.whatsapp),
    occupation: str(row.occupation),
    consent: Boolean(row.consent),
    source: str(row.source),
    utm_source: str(row.utm_source),
    utm_medium: str(row.utm_medium),
    utm_campaign: str(row.utm_campaign),
    status: row.status as Registration["status"],
    payment_status: row.payment_status as Registration["payment_status"],
    payment_amount: row.payment_amount === null || row.payment_amount === undefined ? null : Number(row.payment_amount),
    ticket_id: str(row.ticket_id),
    ticket_url: str(row.ticket_url),
    notes: String(row.notes ?? ""),
    receipt_clicked_at: str(row.receipt_clicked_at),
  };
}

export function ticketFromRow(row: Row): Ticket {
  return {
    id: String(row.id),
    code: String(row.code),
    registration_id: String(row.registration_id),
    event_id: String(row.event_id),
    holder_name: String(row.holder_name),
    created_at: String(row.created_at),
  };
}

export function testimonialFromRow(row: Row): Testimonial {
  return {
    id: String(row.id),
    name: String(row.name),
    quote: String(row.quote),
    rating: Number(row.rating),
    photo_key: str(row.photo_key),
    published: Boolean(row.published),
    created_at: String(row.created_at),
  };
}

export const REGISTRATION_COLUMNS = [
  "id",
  "number",
  "access_token",
  "created_at",
  "updated_at",
  "name",
  "phone",
  "whatsapp",
  "occupation",
  "consent",
  "source",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "status",
  "payment_status",
  "payment_amount",
  "ticket_id",
  "ticket_url",
  "notes",
  "receipt_clicked_at",
] as const;
