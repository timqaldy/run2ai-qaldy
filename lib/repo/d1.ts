import { defaultEvent, EVENT_ID, PAID_STATUSES } from "@/lib/defaults";
import type { EventInfo, Registration } from "@/types";
import {
  eventFromRow,
  REGISTRATION_COLUMNS,
  registrationFromRow,
  settingsFromValue,
  testimonialFromRow,
  ticketFromRow,
} from "./rows";
import type { Repo } from "./types";

type Stmt = {
  bind: (...values: unknown[]) => Stmt;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
  run: () => Promise<unknown>;
};

export type D1Like = { prepare: (query: string) => Stmt };

export type R2Like = {
  put: (key: string, body: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
  get: (key: string) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer>; httpMetadata?: { contentType?: string } } | null>;
  delete: (key: string) => Promise<void>;
};

export const PATCHABLE = new Set([
  "status",
  "payment_status",
  "payment_amount",
  "ticket_id",
  "ticket_url",
  "notes",
  "receipt_clicked_at",
]);

const EVENT_FIELDS =["name", "event_type", "format", "date", "time", "address", "capacity", "price", "currency", "organizers"] as const;

export function createD1Repo(db: D1Like, bucket: R2Like | undefined): Repo {
  async function getEvent(): Promise<EventInfo> {
    const row = await db.prepare("SELECT * FROM events WHERE id = ?").bind(EVENT_ID).first();
    return eventFromRow(row);
  }

  async function getSettings() {
    const row = await db.prepare("SELECT value FROM settings WHERE key = 'site'").first<{ value: string }>();
    return settingsFromValue(row?.value ?? null);
  }

  async function getRegistration(id: string) {
    const row = await db.prepare("SELECT * FROM registrations WHERE id = ?").bind(id).first();
    return row ? registrationFromRow(row) : null;
  }

  function requireBucket() {
    if (!bucket) throw new Error("R2 binding FILES is not configured");
    return bucket;
  }

  return {
    kind: "d1",
    getEvent,
    async updateEvent(patch) {
      const next = { ...(await getEvent()), ...patch, id: EVENT_ID };
      await db
        .prepare(
          `INSERT INTO events (id, ${EVENT_FIELDS.join(", ")}) VALUES (?, ${EVENT_FIELDS.map(() => "?").join(", ")})
           ON CONFLICT(id) DO UPDATE SET ${EVENT_FIELDS.map((f) => `${f} = excluded.${f}`).join(", ")}`,
        )
        .bind(next.id, ...EVENT_FIELDS.map((f) => next[f] ?? defaultEvent[f]))
        .run();
      return next;
    },
    getSettings,
    async updateSettings(patch) {
      const next = { ...(await getSettings()), ...patch };
      await db
        .prepare(
          "INSERT INTO settings (key, value) VALUES ('site', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        )
        .bind(JSON.stringify(next))
        .run();
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
      await db
        .prepare(
          `INSERT INTO registrations (${REGISTRATION_COLUMNS.join(", ")}) VALUES (${REGISTRATION_COLUMNS.map(() => "?").join(", ")})`,
        )
        .bind(...REGISTRATION_COLUMNS.map((c) => (c === "consent" ? (row.consent ? 1 : 0) : row[c])))
        .run();
      return row;
    },
    async listRegistrations() {
      const { results } = await db.prepare("SELECT * FROM registrations ORDER BY created_at DESC").all();
      return results.map(registrationFromRow);
    },
    getRegistration,
    async updateRegistration(id, patch) {
      const entries = Object.entries(patch).filter(
        ([k, v]) => v !== undefined && PATCHABLE.has(k),
      );
      if (entries.length) {
        await db
          .prepare(
            `UPDATE registrations SET ${entries.map(([k]) => `${k} = ?`).join(", ")}, updated_at = ? WHERE id = ?`,
          )
          .bind(...entries.map(([, v]) => v), new Date().toISOString(), id)
          .run();
      }
      return getRegistration(id);
    },
    async deleteRegistration(id) {
      await db.prepare("DELETE FROM tickets WHERE registration_id = ?").bind(id).run();
      await db.prepare("DELETE FROM registrations WHERE id = ?").bind(id).run();
    },
    async countPaid() {
      const row = await db
        .prepare(`SELECT COUNT(*) AS count FROM registrations WHERE status IN (${PAID_STATUSES.map(() => "?").join(", ")})`)
        .bind(...PAID_STATUSES)
        .first<{ count: number }>();
      return Number(row?.count ?? 0);
    },
    async createTicket(ticket) {
      await db
        .prepare(
          "INSERT INTO tickets (id, code, registration_id, event_id, holder_name, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(ticket.id, ticket.code, ticket.registration_id, ticket.event_id, ticket.holder_name, ticket.created_at)
        .run();
      return ticket;
    },
    async getTicketByCode(code) {
      const row = await db.prepare("SELECT * FROM tickets WHERE code = ?").bind(code).first();
      return row ? ticketFromRow(row) : null;
    },
    async getTicketByRegistration(registrationId) {
      const row = await db.prepare("SELECT * FROM tickets WHERE registration_id = ?").bind(registrationId).first();
      return row ? ticketFromRow(row) : null;
    },
    async listTestimonials(onlyPublished) {
      const { results } = await db
        .prepare(
          `SELECT * FROM testimonials ${onlyPublished ? "WHERE published = 1" : ""} ORDER BY created_at DESC`,
        )
        .all();
      return results.map(testimonialFromRow);
    },
    async saveTestimonial(item) {
      await db
        .prepare(
          `INSERT INTO testimonials (id, name, quote, rating, photo_key, published, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET name = excluded.name, quote = excluded.quote, rating = excluded.rating,
           photo_key = excluded.photo_key, published = excluded.published`,
        )
        .bind(item.id, item.name, item.quote, item.rating, item.photo_key, item.published ? 1 : 0, item.created_at)
        .run();
      return item;
    },
    async deleteTestimonial(id) {
      await db.prepare("DELETE FROM testimonials WHERE id = ?").bind(id).run();
    },
    async putFile(key, body, contentType) {
      await requireBucket().put(key, body, { httpMetadata: { contentType } });
    },
    async getFile(key) {
      const object = await requireBucket().get(key);
      if (!object) return null;
      return {
        body: await object.arrayBuffer(),
        contentType: object.httpMetadata?.contentType || "application/octet-stream",
      };
    },
    async deleteFile(key) {
      await requireBucket().delete(key);
    },
  };
}
