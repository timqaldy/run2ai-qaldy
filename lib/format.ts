import type { EventInfo, Registration, Settings } from "@/types";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function formatPrice(amount: number, currency = "₸") {
  return `${new Intl.NumberFormat("ru-RU").format(amount).replace(/ /g, " ")} ${currency}`;
}

export function formatDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : iso;
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Almaty",
  }).format(d);
}

export function fillTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? values[key] : whole,
  );
}

export function templateValues(
  event: EventInfo,
  registration?: Pick<Registration, "name" | "phone" | "number" | "ticket_url">,
) {
  return {
    event: event.name,
    event_upper: event.name.toUpperCase(),
    type: event.event_type,
    type_upper: event.event_type.toUpperCase(),
    date: formatDate(event.date),
    time: event.time,
    price: formatPrice(event.price, event.currency),
    name: registration?.name ?? "",
    phone: registration?.phone ?? "",
    number: registration?.number ?? "",
    ticket_url: registration?.ticket_url ?? "",
  };
}

export function receiptMessage(event: EventInfo, settings: Settings, registration: Registration) {
  return fillTemplate(settings.whatsapp_message_template, templateValues(event, registration));
}

export function ticketMessage(event: EventInfo, settings: Settings, registration: Registration) {
  return fillTemplate(settings.ticket_message_template, templateValues(event, registration));
}

export function fileUrl(key: string | null) {
  return key ? `/api/files/${key}` : null;
}
