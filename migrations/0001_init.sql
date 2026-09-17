-- Cloudflare D1 (SQLite)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  address TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  price INTEGER NOT NULL,
  currency TEXT NOT NULL,
  organizers TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  occupation TEXT,
  consent INTEGER NOT NULL,
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  payment_amount INTEGER,
  ticket_id TEXT,
  ticket_url TEXT,
  notes TEXT NOT NULL DEFAULT '',
  receipt_clicked_at TEXT
);
CREATE INDEX IF NOT EXISTS registrations_status_idx ON registrations(status);
CREATE INDEX IF NOT EXISTS registrations_created_idx ON registrations(created_at);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  registration_id TEXT NOT NULL UNIQUE REFERENCES registrations(id),
  event_id TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quote TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  photo_key TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

INSERT OR IGNORE INTO events (id, name, event_type, format, date, time, address, capacity, price, currency, organizers)
VALUES ('probezhka-beginner', 'Пробежка по ИИ-шкам', 'Beginner', 'Online Workshop',
        '2026-09-19', '15:00', 'По многочисленным просьбам теперь в онлайн.', 15, 10000, '₸', 'Таир + Тимур');
