export type RegistrationStatus =
  | "new"
  | "waiting_payment"
  | "receipt_received"
  | "paid"
  | "ticket_sent"
  | "waitlist"
  | "cancelled";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded";

export type EventInfo = {
  id: string;
  name: string;
  event_type: string;
  format: string;
  date: string;
  time: string;
  address: string;
  capacity: number;
  price: number;
  currency: string;
  organizers: string;
};

export type Settings = {
  whatsapp_number: string;
  whatsapp_message_template: string;
  ticket_message_template: string;
  payment_instructions: string;
  kaspi_qr_key: string | null;
  kaspi_pay_link: string | null;
  qr_active: boolean;
  hero_image_key: string | null;
  cta_text: string;
  confirmation_text: string;
  offline_paid_seats: number;
  posthog_key: string | null;
  posthog_host: "https://eu.i.posthog.com" | "https://us.i.posthog.com";
};

export type Registration = {
  id: string;
  number: string;
  access_token: string;
  created_at: string;
  updated_at: string;
  name: string;
  phone: string;
  whatsapp: string;
  occupation: string | null;
  consent: boolean;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: RegistrationStatus;
  payment_status: PaymentStatus;
  payment_amount: number | null;
  ticket_id: string | null;
  ticket_url: string | null;
  notes: string;
  receipt_clicked_at: string | null;
};

export type Ticket = {
  id: string;
  code: string;
  registration_id: string;
  event_id: string;
  holder_name: string;
  created_at: string;
};

export type Testimonial = {
  id: string;
  name: string;
  quote: string;
  rating: number;
  photo_key: string | null;
  published: boolean;
  created_at: string;
};

export type NewRegistration = Omit<
  Registration,
  "created_at" | "updated_at" | "ticket_id" | "ticket_url" | "receipt_clicked_at" | "payment_amount"
>;

export type RegistrationPatch = Partial<
  Pick<
    Registration,
    | "status"
    | "payment_status"
    | "payment_amount"
    | "ticket_id"
    | "ticket_url"
    | "notes"
    | "receipt_clicked_at"
  >
>;

export type Stats = {
  total: number;
  waitingPayment: number;
  paid: number;
  ticketsSent: number;
  waitlist: number;
  seatsLeft: number;
  capacity: number;
};
