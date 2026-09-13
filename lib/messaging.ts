import { whatsappLink } from "@/lib/phone";

export type DeliveryResult =
  | { mode: "manual_link"; url: string }
  | { mode: "sent"; providerMessageId: string };

export interface TicketDelivery {
  deliver(input: { phone: string; message: string }): Promise<DeliveryResult>;
}

// MVP: admin opens a prefilled WhatsApp chat and presses Send personally.
// A WhatsApp Business Cloud API implementation can replace this without touching callers.
export const manualWhatsAppDelivery: TicketDelivery = {
  async deliver({ phone, message }) {
    return { mode: "manual_link", url: whatsappLink(phone, message) };
  },
};

export function getTicketDelivery(): TicketDelivery {
  return manualWhatsAppDelivery;
}
