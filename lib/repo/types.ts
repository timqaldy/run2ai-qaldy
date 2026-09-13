import type {
  EventInfo,
  NewRegistration,
  Registration,
  RegistrationPatch,
  Settings,
  Testimonial,
  Ticket,
} from "@/types";

export type StoredFile = { body: ArrayBuffer; contentType: string };

export interface Repo {
  kind: "local" | "d1" | "supabase";
  getEvent(): Promise<EventInfo>;
  updateEvent(patch: Partial<Omit<EventInfo, "id">>): Promise<EventInfo>;
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;
  createRegistration(input: NewRegistration): Promise<Registration>;
  listRegistrations(): Promise<Registration[]>;
  getRegistration(id: string): Promise<Registration | null>;
  updateRegistration(id: string, patch: RegistrationPatch): Promise<Registration | null>;
  deleteRegistration(id: string): Promise<void>;
  countPaid(): Promise<number>;
  createTicket(ticket: Ticket): Promise<Ticket>;
  getTicketByCode(code: string): Promise<Ticket | null>;
  getTicketByRegistration(registrationId: string): Promise<Ticket | null>;
  listTestimonials(onlyPublished: boolean): Promise<Testimonial[]>;
  saveTestimonial(item: Testimonial): Promise<Testimonial>;
  deleteTestimonial(id: string): Promise<void>;
  putFile(key: string, body: ArrayBuffer, contentType: string): Promise<void>;
  getFile(key: string): Promise<StoredFile | null>;
  deleteFile(key: string): Promise<void>;
}
