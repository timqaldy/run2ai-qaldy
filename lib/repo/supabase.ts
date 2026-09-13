import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { EVENT_ID, PAID_STATUSES } from "@/lib/defaults";
import type { Registration } from "@/types";
import { PATCHABLE } from "./d1";
import {
  eventFromRow,
  registrationFromRow,
  settingsFromValue,
  testimonialFromRow,
  ticketFromRow,
} from "./rows";
import type { Repo } from "./types";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(`Supabase: ${error.message}`);
}

export function createSupabaseRepo(): Repo {
  const client: SupabaseClient = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  async function getEvent() {
    const { data, error } = await client.from("events").select("*").eq("id", EVENT_ID).maybeSingle();
    fail(error);
    return eventFromRow(data);
  }

  async function getSettings() {
    const { data, error } = await client.from("settings").select("value").eq("key", "site").maybeSingle();
    fail(error);
    return settingsFromValue(data?.value ?? null);
  }

  async function getRegistration(id: string) {
    const { data, error } = await client.from("registrations").select("*").eq("id", id).maybeSingle();
    fail(error);
    return data ? registrationFromRow(data) : null;
  }

  return {
    kind: "supabase",
    getEvent,
    async updateEvent(patch) {
      const next = { ...(await getEvent()), ...patch, id: EVENT_ID };
      const { error } = await client.from("events").upsert(next);
      fail(error);
      return next;
    },
    getSettings,
    async updateSettings(patch) {
      const next = { ...(await getSettings()), ...patch };
      const { error } = await client.from("settings").upsert({ key: "site", value: next });
      fail(error);
      return next;
    },
    async createRegistration(input) {
      const now = new Date().toISOString();
      const row: Registration = {
        ...input,
        created_at: now,
        updated_at: now,
        payment_amount: null,
        ticket_id: null,
        ticket_url: null,
        receipt_clicked_at: null,
      };
      const { error } = await client.from("registrations").insert(row);
      fail(error);
      return row;
    },
    async listRegistrations() {
      const { data, error } = await client
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });
      fail(error);
      return (data ?? []).map(registrationFromRow);
    },
    getRegistration,
    async updateRegistration(id, patch) {
      const clean = Object.fromEntries(
        Object.entries(patch).filter(([k, v]) => v !== undefined && PATCHABLE.has(k)),
      );
      const { error } = await client
        .from("registrations")
        .update({ ...clean, updated_at: new Date().toISOString() })
        .eq("id", id);
      fail(error);
      return getRegistration(id);
    },
    async deleteRegistration(id) {
      const tickets = await client.from("tickets").delete().eq("registration_id", id);
      fail(tickets.error);
      const { error } = await client.from("registrations").delete().eq("id", id);
      fail(error);
    },
    async countPaid() {
      const { count, error } = await client
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .in("status", [...PAID_STATUSES]);
      fail(error);
      return count ?? 0;
    },
    async createTicket(ticket) {
      const { error } = await client.from("tickets").insert(ticket);
      fail(error);
      return ticket;
    },
    async getTicketByCode(code) {
      const { data, error } = await client.from("tickets").select("*").eq("code", code).maybeSingle();
      fail(error);
      return data ? ticketFromRow(data) : null;
    },
    async getTicketByRegistration(registrationId) {
      const { data, error } = await client
        .from("tickets")
        .select("*")
        .eq("registration_id", registrationId)
        .maybeSingle();
      fail(error);
      return data ? ticketFromRow(data) : null;
    },
    async listTestimonials(onlyPublished) {
      let query = client.from("testimonials").select("*").order("created_at", { ascending: false });
      if (onlyPublished) query = query.eq("published", true);
      const { data, error } = await query;
      fail(error);
      return (data ?? []).map(testimonialFromRow);
    },
    async saveTestimonial(item) {
      const { error } = await client.from("testimonials").upsert(item);
      fail(error);
      return item;
    },
    async deleteTestimonial(id) {
      const { error } = await client.from("testimonials").delete().eq("id", id);
      fail(error);
    },
    async putFile(key, body, contentType) {
      const { error } = await client.storage.from(BUCKET).upload(key, body, { contentType, upsert: true });
      fail(error);
    },
    async getFile(key) {
      const { data, error } = await client.storage.from(BUCKET).download(key);
      if (error || !data) return null;
      return { body: await data.arrayBuffer(), contentType: data.type || "application/octet-stream" };
    },
    async deleteFile(key) {
      const { error } = await client.storage.from(BUCKET).remove([key]);
      fail(error);
    },
  };
}
