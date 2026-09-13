import { siteUrl } from "@/lib/format";
import { accessToken, registrationNumber, ticketCode } from "@/lib/ids";
import { normalizePhone } from "@/lib/phone";
import { getRepo } from "@/lib/repo";
import type { EventInfo, Registration, Settings, Testimonial } from "@/types";

export type PublicState = {
  event: EventInfo;
  settings: Omit<Settings, "ticket_message_template">;
  paid: number;
  seatsLeft: number;
  soldOut: boolean;
  paymentAvailable: boolean;
  testimonials: Testimonial[];
};

export async function getPublicState(): Promise<PublicState> {
  const repo = await getRepo();
  const [event, settings, paid, testimonials] = await Promise.all([
    repo.getEvent(),
    repo.getSettings(),
    repo.countPaid(),
    repo.listTestimonials(true),
  ]);
  const seatsLeft = Math.max(0, event.capacity - paid);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ticket_message_template, ...publicSettings } = settings;
  return {
    event,
    settings: publicSettings,
    paid,
    seatsLeft,
    soldOut: seatsLeft === 0,
    paymentAvailable: Boolean(settings.qr_active && settings.kaspi_qr_key),
    testimonials,
  };
}

export async function createLead(input: {
  name: string;
  phone: string;
  occupation?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
}) {
  const repo = await getRepo();
  const [event, paid] = await Promise.all([repo.getEvent(), repo.countPaid()]);
  const soldOut = paid >= event.capacity;
  const phone = normalizePhone(input.phone);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await repo.createRegistration({
        id: crypto.randomUUID(),
        number: registrationNumber(),
        access_token: accessToken(),
        name: input.name,
        phone: `+${phone}`,
        whatsapp: phone,
        occupation: input.occupation ?? null,
        consent: true,
        source: input.utm_source || refererSource(input.referrer) || "direct",
        utm_source: input.utm_source ?? null,
        utm_medium: input.utm_medium ?? null,
        utm_campaign: input.utm_campaign ?? null,
        status: soldOut ? "waitlist" : "new",
        payment_status: "unpaid",
        notes: "",
      });
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  throw new Error("unreachable");
}

function refererSource(referrer?: string) {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host.includes("instagram")) return "instagram";
    if (host.includes("whatsapp") || host === "wa.me") return "whatsapp";
    if (host.includes("facebook")) return "facebook";
    return host;
  } catch {
    return null;
  }
}

export async function confirmPayment(id: string): Promise<Registration | null> {
  const repo = await getRepo();
  const [registration, event] = await Promise.all([repo.getRegistration(id), repo.getEvent()]);
  if (!registration) return null;

  let ticket = await repo.getTicketByRegistration(id);
  if (!ticket) {
    ticket = await repo.createTicket({
      id: crypto.randomUUID(),
      code: ticketCode(),
      registration_id: id,
      event_id: event.id,
      holder_name: registration.name,
      created_at: new Date().toISOString(),
    });
  }

  const updated = await repo.updateRegistration(id, {
    status: registration.status === "ticket_sent" ? "ticket_sent" : "paid",
    payment_status: "paid",
    payment_amount: event.price,
    ticket_id: ticket.code,
    ticket_url: `${siteUrl()}/ticket/${ticket.code}`,
  });
  trackServer("payment_confirmed", { registration: registration.number });
  return updated;
}

export function trackServer(event: string, props: Record<string, string> = {}) {
  // Hook for GA4 Measurement Protocol / Meta CAPI once credentials exist.
  console.log(JSON.stringify({ analytics: event, ...props, at: new Date().toISOString() }));
}
