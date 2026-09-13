import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultEvent, defaultSettings, PAID_STATUSES } from "@/lib/defaults";
import type { EventInfo, Registration, Settings, Testimonial, Ticket } from "@/types";
import type { Repo } from "./types";

type Db = {
  event: EventInfo;
  settings: Settings;
  registrations: Registration[];
  tickets: Ticket[];
  testimonials: Testimonial[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

let queue: Promise<unknown> = Promise.resolve();

async function read(): Promise<Db> {
  try {
    const raw = JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Partial<Db>;
    return {
      event: { ...defaultEvent, ...raw.event },
      settings: { ...defaultSettings, ...raw.settings },
      registrations: raw.registrations ?? [],
      tickets: raw.tickets ?? [],
      testimonials: raw.testimonials ?? [],
    };
  } catch {
    return {
      event: defaultEvent,
      settings: defaultSettings,
      registrations: [],
      tickets: [],
      testimonials: [],
    };
  }
}

function mutate<T>(fn: (db: Db) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await read();
    const result = fn(db);
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DB_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, DB_FILE);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

function filePath(key: string) {
  const safe = key.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(UPLOAD_DIR, safe);
}

export function createLocalRepo(): Repo {
  return {
    kind: "local",
    async getEvent() {
      return (await read()).event;
    },
    updateEvent(patch) {
      return mutate((db) => (db.event = { ...db.event, ...patch }));
    },
    async getSettings() {
      return (await read()).settings;
    },
    updateSettings(patch) {
      return mutate((db) => (db.settings = { ...db.settings, ...patch }));
    },
    createRegistration(input) {
      return mutate((db) => {
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
        db.registrations.push(row);
        return row;
      });
    },
    async listRegistrations() {
      return [...(await read()).registrations].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      );
    },
    async getRegistration(id) {
      return (await read()).registrations.find((r) => r.id === id) ?? null;
    },
    updateRegistration(id, patch) {
      return mutate((db) => {
        const index = db.registrations.findIndex((r) => r.id === id);
        if (index < 0) return null;
        const next = { ...db.registrations[index], ...patch, updated_at: new Date().toISOString() };
        db.registrations[index] = next;
        return next;
      });
    },
    async deleteRegistration(id) {
      await mutate((db) => {
        db.tickets = db.tickets.filter((t) => t.registration_id !== id);
        db.registrations = db.registrations.filter((r) => r.id !== id);
      });
    },
    async countPaid() {
      return (await read()).registrations.filter((r) =>
        (PAID_STATUSES as readonly string[]).includes(r.status),
      ).length;
    },
    createTicket(ticket) {
      return mutate((db) => {
        db.tickets.push(ticket);
        return ticket;
      });
    },
    async getTicketByCode(code) {
      return (await read()).tickets.find((t) => t.code === code) ?? null;
    },
    async getTicketByRegistration(registrationId) {
      return (await read()).tickets.find((t) => t.registration_id === registrationId) ?? null;
    },
    async listTestimonials(onlyPublished) {
      const items = (await read()).testimonials.sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      );
      return onlyPublished ? items.filter((t) => t.published) : items;
    },
    saveTestimonial(item) {
      return mutate((db) => {
        const index = db.testimonials.findIndex((t) => t.id === item.id);
        if (index < 0) db.testimonials.push(item);
        else db.testimonials[index] = item;
        return item;
      });
    },
    async deleteTestimonial(id) {
      await mutate((db) => {
        db.testimonials = db.testimonials.filter((t) => t.id !== id);
      });
    },
    async putFile(key, body, contentType) {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await fs.writeFile(filePath(key), Buffer.from(body));
      await fs.writeFile(`${filePath(key)}.type`, contentType);
    },
    async getFile(key) {
      try {
        const buf = await fs.readFile(filePath(key));
        const contentType = await fs.readFile(`${filePath(key)}.type`, "utf8");
        return {
          body: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
          contentType,
        };
      } catch {
        return null;
      }
    },
    async deleteFile(key) {
      await fs.rm(filePath(key), { force: true });
      await fs.rm(`${filePath(key)}.type`, { force: true });
    },
  };
}
