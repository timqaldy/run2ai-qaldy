"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fileUrl } from "@/lib/format";
import type { EventInfo, Settings, Testimonial } from "@/types";

const input =
  "mt-1.5 block min-h-11 w-full rounded-xl border border-white/15 bg-night px-3 text-white focus:border-cyan focus:outline-none";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      {children}
      {hint ? <span className="mt-1 block text-xs font-normal text-mist">{hint}</span> : null}
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-deep p-5 md:p-6">
      <h2 className="font-display text-xl font-black uppercase italic">{title}</h2>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

export function SettingsForm({
  event: initialEvent,
  settings: initialSettings,
  testimonials,
}: {
  event: EventInfo;
  settings: Settings;
  testimonials: Testimonial[];
}) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [settings, setSettings] = useState(initialSettings);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const ev = <K extends keyof EventInfo>(key: K, value: EventInfo[K]) => setEvent((p) => ({ ...p, [key]: value }));
  const st = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((p) => ({ ...p, [key]: value }));

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: {
            name: event.name,
            event_type: event.event_type,
            format: event.format,
            date: event.date,
            time: event.time,
            address: event.address,
            capacity: event.capacity,
            price: event.price,
            currency: event.currency,
            organizers: event.organizers,
          },
          settings: {
            whatsapp_number: settings.whatsapp_number,
            whatsapp_message_template: settings.whatsapp_message_template,
            ticket_message_template: settings.ticket_message_template,
            payment_instructions: settings.payment_instructions,
            qr_active: settings.qr_active,
            cta_text: settings.cta_text,
            confirmation_text: settings.confirmation_text,
          },
        }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (res.status === 401) router.push("/admin/login");
      setStatus(data.ok ? { kind: "ok", text: "Сохранено. Лендинг уже обновлён." } : { kind: "error", text: data.message || "Ошибка" });
    } catch {
      setStatus({ kind: "error", text: "Нет соединения" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-4xl gap-5 px-4 py-6 pb-28">
      <Card title="Мероприятие">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Event Name"><input className={input} value={event.name} onChange={(e) => ev("name", e.target.value)} /></Field>
          <Field label="Event Type"><input className={input} value={event.event_type} onChange={(e) => ev("event_type", e.target.value)} /></Field>
          <Field label="Формат"><input className={input} value={event.format} onChange={(e) => ev("format", e.target.value)} /></Field>
          <Field label="Организаторы"><input className={input} value={event.organizers} onChange={(e) => ev("organizers", e.target.value)} /></Field>
          <Field label="Date"><input type="date" className={input} value={event.date} onChange={(e) => ev("date", e.target.value)} /></Field>
          <Field label="Time"><input type="time" className={input} value={event.time} onChange={(e) => ev("time", e.target.value)} /></Field>
          <Field label="Address" hint="Показывается на лендинге и в билете">
            <input className={input} value={event.address} onChange={(e) => ev("address", e.target.value)} />
          </Field>
          <Field label="Capacity" hint="Считаются только оплаченные заявки">
            <input type="number" min={1} className={input} value={event.capacity} onChange={(e) => ev("capacity", Number(e.target.value))} />
          </Field>
          <Field label="Price"><input type="number" min={0} className={input} value={event.price} onChange={(e) => ev("price", Number(e.target.value))} /></Field>
          <Field label="Currency"><input className={input} value={event.currency} onChange={(e) => ev("currency", e.target.value)} /></Field>
        </div>
      </Card>

      <Card title="Лендинг">
        <Field label="Основной CTA"><input className={input} value={settings.cta_text} onChange={(e) => st("cta_text", e.target.value)} /></Field>
        <Field label="Текст подтверждения (после отправки чека)">
          <textarea rows={3} className={`${input} py-2`} value={settings.confirmation_text} onChange={(e) => st("confirmation_text", e.target.value)} />
        </Field>
        <ImageSetting
          kind="hero"
          label="Главное фото (по умолчанию — фото с постера)"
          value={settings.hero_image_key}
          onChange={(key) => st("hero_image_key", key)}
          onStatus={setStatus}
        />
      </Card>

      <Card title="WhatsApp">
        <Field label="WhatsApp number" hint="Можно в формате 8777… — ссылка wa.me нормализуется автоматически">
          <input className={input} value={settings.whatsapp_number} onChange={(e) => st("whatsapp_number", e.target.value)} />
        </Field>
        <Field label="WhatsApp Message Template (чек от клиента)" hint="Переменные: {event} {price} {name} {phone} {number} {date} {time}">
          <textarea rows={5} className={`${input} py-2`} value={settings.whatsapp_message_template} onChange={(e) => st("whatsapp_message_template", e.target.value)} />
        </Field>
        <Field label="Ticket Message Template (билет клиенту)" hint="Переменные: {event_upper} {type_upper} {date} {time} {ticket_url} {name}">
          <textarea rows={8} className={`${input} py-2`} value={settings.ticket_message_template} onChange={(e) => st("ticket_message_template", e.target.value)} />
        </Field>
      </Card>

      <Card title="Оплата · Kaspi QR">
        <ImageSetting kind="qr" label="Kaspi QR Image" value={settings.kaspi_qr_key} onChange={(key) => st("kaspi_qr_key", key)} onStatus={setStatus} />
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" className="size-5 accent-[#00AEEF]" checked={settings.qr_active} onChange={(e) => st("qr_active", e.target.checked)} />
          QR активен {settings.qr_active ? "(ON)" : "(OFF)"}
        </label>
        {!settings.kaspi_qr_key || !settings.qr_active ? (
          <p className="rounded-xl bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
            Сейчас клиенты увидят: «Оплата временно недоступна. Напишите нам в WhatsApp.»
          </p>
        ) : null}
        <Field label="Инструкция по оплате">
          <textarea rows={2} className={`${input} py-2`} value={settings.payment_instructions} onChange={(e) => st("payment_instructions", e.target.value)} />
        </Field>
      </Card>

      <TestimonialsManager initial={testimonials} />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-night/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button type="button" onClick={save} disabled={saving} className="cta min-h-12 rounded-xl px-6 font-display font-black uppercase text-night disabled:opacity-60">
            {saving ? "Сохраняем…" : "Сохранить настройки"}
          </button>
          {status ? (
            <p role="status" className={status.kind === "ok" ? "text-emerald-300" : "text-red-300"}>{status.text}</p>
          ) : (
            <p className="text-sm text-mist">Фото и QR сохраняются сразу при загрузке.</p>
          )}
        </div>
      </div>
    </main>
  );
}

async function uploadFile(kind: string, file: File) {
  const form = new FormData();
  form.set("kind", kind);
  form.set("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  return (await res.json()) as { ok: boolean; message?: string; key?: string };
}

function ImageSetting({
  kind,
  label,
  value,
  onChange,
  onStatus,
}: {
  kind: "qr" | "hero";
  label: string;
  value: string | null;
  onChange: (key: string | null) => void;
  onStatus: (s: { kind: "ok" | "error"; text: string }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const preview = fileUrl(value);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const data = await uploadFile(kind, file);
      if (data.ok && data.key) {
        onChange(data.key);
        onStatus({ kind: "ok", text: "Изображение загружено и уже на лендинге" });
      } else onStatus({ kind: "error", text: data.message || "Ошибка загрузки" });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Удалить изображение?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/upload?kind=${kind}`, { method: "DELETE" });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (data.ok) {
        onChange(null);
        onStatus({ kind: "ok", text: "Изображение удалено" });
      } else onStatus({ kind: "error", text: data.message || "Ошибка" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <div className={`grid size-36 place-items-center overflow-hidden rounded-2xl border border-dashed border-white/20 ${kind === "qr" ? "bg-white" : "bg-night"}`}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Предпросмотр" className="size-full object-contain" />
          ) : (
            <span className="px-2 text-center text-xs text-mist">{kind === "qr" ? "QR не загружен" : "Используется фото с постера"}</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className={`cursor-pointer rounded-xl bg-electric px-4 py-2.5 text-center font-bold text-night ${busy ? "opacity-50" : ""}`}>
            {busy ? "Загрузка…" : preview ? "Заменить" : kind === "qr" ? "Загрузить Kaspi QR" : "Загрузить фото"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {preview ? (
            <button type="button" disabled={busy} onClick={remove} className="rounded-xl bg-white/5 px-4 py-2.5 font-semibold text-red-300 hover:bg-white/10">
              Удалить
            </button>
          ) : null}
          <span className="text-xs text-mist">PNG / JPG / WEBP, до 5 МБ</span>
        </div>
      </div>
    </div>
  );
}

function TestimonialsManager({ initial }: { initial: Testimonial[] }) {
  const [items, setItems] = useState(initial);
  const empty = { name: "", quote: "", rating: 5, published: true, photo_key: null as string | null };
  const [draft, setDraft] = useState<typeof empty & { id?: string }>(empty);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as { ok: boolean; message?: string; item?: Testimonial };
      if (!data.ok || !data.item) {
        setMessage(data.message || "Ошибка");
        return;
      }
      const item = data.item;
      setItems((prev) => [item, ...prev.filter((t) => t.id !== item.id)]);
      setDraft(empty);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Удалить отзыв?")) return;
    await fetch(`/api/admin/testimonials?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <Card title="Отзывы">
      <p className="text-sm text-mist">Блок скрыт на лендинге, пока нет опубликованных отзывов. Добавляйте только реальные отзывы.</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Name"><input className={input} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="Rating">
          <select className={input} value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Quote"><textarea rows={3} className={`${input} py-2`} value={draft.quote} onChange={(e) => setDraft({ ...draft, quote: e.target.value })} /></Field>
      <div className="flex flex-wrap items-center gap-4">
        <label className="cursor-pointer rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold">
          {draft.photo_key ? "Фото загружено ✓" : "Photo"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const data = await uploadFile("testimonial", file);
              if (data.ok && data.key) setDraft((d) => ({ ...d, photo_key: data.key ?? null }));
              else setMessage(data.message || "Ошибка загрузки");
            }}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="size-5 accent-[#00AEEF]" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
          published
        </label>
        <button type="button" disabled={busy} onClick={submit} className="rounded-xl bg-electric px-4 py-2 font-bold text-night disabled:opacity-50">
          {draft.id ? "Сохранить отзыв" : "Добавить отзыв"}
        </button>
        {draft.id ? <button type="button" onClick={() => setDraft(empty)} className="text-sm text-mist underline">Отмена</button> : null}
      </div>
      {message ? <p className="text-sm text-red-300">{message}</p> : null}
      <ul className="grid gap-2">
        {items.map((t) => (
          <li key={t.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white/5 p-3">
            <div>
              <p className="font-semibold">{t.name} · {"★".repeat(t.rating)} {t.published ? "" : <span className="text-xs text-mist">(скрыт)</span>}</p>
              <p className="text-sm text-mist">{t.quote}</p>
            </div>
            <div className="flex shrink-0 gap-2 text-sm">
              <button type="button" className="text-cyan underline" onClick={() => setDraft({ id: t.id, name: t.name, quote: t.quote, rating: t.rating, published: t.published, photo_key: t.photo_key })}>Изменить</button>
              <button type="button" className="text-red-300 underline" onClick={() => remove(t.id)}>Удалить</button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
