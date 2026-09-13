"use client";

import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { track } from "@/lib/analytics";
import { formatDateTime, formatPrice, ticketMessage } from "@/lib/format";
import { whatsappLink } from "@/lib/phone";
import { ConfirmButton } from "./ConfirmButton";
import type { EventInfo, Registration, RegistrationStatus, Settings } from "@/types";

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  new: "Новая",
  waiting_payment: "Ждёт оплату",
  receipt_received: "Чек получен",
  paid: "Оплачено",
  ticket_sent: "Билет отправлен",
  waitlist: "Лист ожидания",
  cancelled: "Отменена",
};

const STATUS_STYLE: Record<RegistrationStatus, string> = {
  new: "bg-white/10 text-white",
  waiting_payment: "bg-amber-400/15 text-amber-300",
  receipt_received: "bg-violet-400/15 text-violet-300",
  paid: "bg-emerald-400/15 text-emerald-300",
  ticket_sent: "bg-cyan/15 text-cyan",
  waitlist: "bg-white/5 text-mist",
  cancelled: "bg-red-500/15 text-red-300",
};

const PAYMENT_LABEL = { unpaid: "Не оплачено", pending: "Ожидается", paid: "Оплачено", refunded: "Возврат" };

export function AdminDashboard({
  initial,
  event,
  settings,
  storage,
}: {
  initial: Registration[];
  event: EventInfo;
  settings: Settings;
  storage: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<RegistrationStatus | "all" | "open">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const count = (...s: RegistrationStatus[]) => rows.filter((r) => s.includes(r.status)).length;
    const paid = count("paid", "ticket_sent");
    return {
      total: rows.length,
      waiting: count("new", "waiting_payment", "receipt_received"),
      paid,
      sent: count("ticket_sent"),
      free: Math.max(0, event.capacity - paid - settings.offline_paid_seats),
    };
  }, [rows, event.capacity, settings.offline_paid_seats]);

  const visible = rows.filter((r) => {
    if (filter === "open" && !["new", "waiting_payment", "receipt_received"].includes(r.status)) return false;
    if (filter !== "all" && filter !== "open" && r.status !== filter) return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return [r.number, r.name, r.phone, r.occupation ?? "", r.source ?? "", r.ticket_id ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(needle.replace(/^#/, ""));
  });

  async function act(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok: boolean; message?: string; registration?: Registration };
      if (res.status === 401) router.push("/admin/login");
      if (!data.ok || !data.registration) {
        setError(data.message || "Не удалось сохранить");
        return null;
      }
      const updated = data.registration;
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    } catch {
      setError("Нет соединения");
      return null;
    } finally {
      setBusyId(null);
    }
  }

  async function confirmPaid(r: Registration) {
    const updated = await act(r.id, { action: "confirm_payment" });
    if (updated) track("payment_confirmed", { number: r.number });
  }

  async function remove(r: Registration) {
    setBusyId(r.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/registrations/${r.id}`, { method: "DELETE" });
      if (res.status === 401) router.push("/admin/login");
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!data.ok) {
        setError(data.message || "Не удалось удалить");
        return;
      }
      setRows((prev) => prev.filter((x) => x.id !== r.id));
      if (openId === r.id) setOpenId(null);
    } catch {
      setError("Нет соединения");
    } finally {
      setBusyId(null);
    }
  }

  function sendTicket(r: Registration) {
    if (!r.ticket_url) return;
    track("ticket_sent", { number: r.number });
    void act(r.id, { action: "mark_ticket_sent" });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["Заявки", stats.total],
          ["Ожидают оплату", stats.waiting],
          ["Оплачено", stats.paid],
          ["Билеты отправлены", stats.sent],
          ["Свободных мест", `${stats.free} / ${event.capacity}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-deep p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-mist">{label}</p>
            <p className="mt-1 font-display text-3xl font-black">{value}</p>
          </div>
        ))}
      </section>

      {storage === "local" ? (
        <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">
          Локальное хранилище (.data/) — для разработки. В продакшене подключите Supabase или Cloudflare D1/R2.
        </p>
      ) : null}

      <section className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск: имя, телефон, #AI-…"
          className="min-h-11 flex-1 rounded-xl border border-white/15 bg-night px-4 focus:border-cyan focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {(["all", "open", "receipt_received", "paid", "ticket_sent", "waitlist", "cancelled"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${filter === key ? "bg-electric text-night" : "bg-white/5 hover:bg-white/10"}`}
            >
              {key === "all" ? "Все" : key === "open" ? "Без оплаты" : STATUS_LABEL[key]}
            </button>
          ))}
        </div>
      </section>

      {error ? <p role="alert" className="mt-3 rounded-xl bg-red-500/15 px-4 py-2 text-red-200">{error}</p> : null}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-deep text-xs uppercase tracking-wider text-mist">
            <tr>
              {["ID", "Имя", "WhatsApp", "Дата заявки", "Статус", "Оплата", "Билет", "Actions"].map((h) => (
                <th key={h} className="px-3 py-3 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-mist">
                  {rows.length ? "Ничего не найдено" : "Заявок пока нет"}
                </td>
              </tr>
            ) : null}
            {visible.map((r) => {
              const busy = busyId === r.id;
              const paid = r.status === "paid" || r.status === "ticket_sent";
              const ticketHref = r.ticket_url ? whatsappLink(r.whatsapp, ticketMessage(event, settings, r)) : null;
              return (
                <Fragment key={r.id}>
                  <tr className="border-t border-white/10 align-top hover:bg-white/[0.02]">
                    <td className="px-3 py-3 font-mono font-bold">#{r.number}</td>
                    <td className="px-3 py-3">
                      <button type="button" className="text-left font-semibold hover:text-cyan" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                        {r.name}
                      </button>
                      {r.occupation ? <p className="text-xs text-mist">{r.occupation}</p> : null}
                    </td>
                    <td className="px-3 py-3">
                      <a className="text-cyan underline" href={whatsappLink(r.whatsapp)} target="_blank" rel="noopener noreferrer">
                        {r.phone}
                      </a>
                      {r.receipt_clicked_at ? <p className="text-xs text-mist">нажал «чек» {formatDateTime(r.receipt_clicked_at)}</p> : null}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                    <td className="px-3 py-3">
                      <select
                        value={r.status}
                        disabled={busy}
                        onChange={(e) => act(r.id, { action: "set_status", status: e.target.value })}
                        className={`rounded-lg border-0 px-2 py-1.5 font-semibold ${STATUS_STYLE[r.status]}`}
                      >
                        {Object.entries(STATUS_LABEL).map(([value, label]) => (
                          <option key={value} value={value} className="bg-night text-white">{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {PAYMENT_LABEL[r.payment_status]}
                      {r.payment_amount ? <p className="text-xs text-mist">{formatPrice(r.payment_amount, event.currency)}</p> : null}
                    </td>
                    <td className="px-3 py-3">
                      {r.ticket_url ? (
                        <a href={r.ticket_url} target="_blank" className="font-mono text-xs text-cyan underline" rel="noopener noreferrer">
                          {r.ticket_id}
                        </a>
                      ) : (
                        <span className="text-mist">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1.5">
                        {!paid && r.status !== "cancelled" ? (
                          <ConfirmButton
                            label="Подтвердить оплату"
                            confirmLabel={`Да, оплачено ${formatPrice(event.price, event.currency)} ✓`}
                            disabled={busy}
                            onConfirm={() => confirmPaid(r)}
                            className="rounded-lg bg-emerald-500 px-3 py-1.5 font-bold text-night"
                            armedClassName="rounded-lg bg-emerald-300 px-3 py-1.5 font-bold text-night ring-2 ring-emerald-200"
                          />
                        ) : null}
                        {paid && ticketHref ? (
                          <a
                            href={ticketHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => sendTicket(r)}
                            className="rounded-lg bg-electric px-3 py-1.5 text-center font-bold text-night"
                          >
                            {r.status === "ticket_sent" ? "Отправить билет ещё раз" : "Отправить билет в WhatsApp"}
                          </a>
                        ) : null}
                        <ConfirmButton
                          label="Удалить"
                          confirmLabel="Точно удалить?"
                          disabled={busy}
                          onConfirm={() => remove(r)}
                          className="rounded-lg px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/10"
                          armedClassName="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white"
                        />
                      </div>
                    </td>
                  </tr>
                  {openId === r.id ? (
                    <tr className="bg-deep/60">
                      <td colSpan={8} className="px-3 py-4">
                        <Details registration={r} busy={busy} onSave={(notes) => act(r.id, { action: "save_notes", notes })} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-mist">
        Kaspi QR не подключён к банковскому API: подтверждайте оплату только после проверки чека. «Подтвердить оплату» закрепляет место за участником и создаёт билет. Кнопки подтверждения и удаления срабатывают по второму нажатию. Кнопка «Отправить билет»
        открывает WhatsApp с готовым сообщением — отправьте его вручную.
      </p>
    </main>
  );
}

function Details({ registration: r, busy, onSave }: { registration: Registration; busy: boolean; onSave: (notes: string) => void }) {
  const [notes, setNotes] = useState(r.notes);
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {[
          ["Источник", r.source],
          ["utm_source", r.utm_source],
          ["utm_medium", r.utm_medium],
          ["utm_campaign", r.utm_campaign],
          ["Обновлено", formatDateTime(r.updated_at)],
        ].map(([k, v]) => (
          <Fragment key={k}>
            <dt className="text-mist">{k}</dt>
            <dd>{v || "—"}</dd>
          </Fragment>
        ))}
      </dl>
      <div>
        <label className="text-sm font-semibold" htmlFor={`notes-${r.id}`}>Заметки</label>
        <textarea
          id={`notes-${r.id}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-white/15 bg-night p-3 focus:border-cyan focus:outline-none"
        />
        <button type="button" disabled={busy || notes === r.notes} onClick={() => onSave(notes)} className="mt-2 rounded-lg bg-white/10 px-4 py-2 font-semibold disabled:opacity-40">
          Сохранить заметку
        </button>
      </div>
    </div>
  );
}
