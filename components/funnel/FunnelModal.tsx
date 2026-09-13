"use client";

import { useEffect, useRef, useState } from "react";
import { captureUtm, track } from "@/lib/analytics";
import { fileUrl, fillTemplate, formatPrice, templateValues } from "@/lib/format";
import { whatsappLink } from "@/lib/phone";
import type { PublicState } from "@/lib/service";

type Saved = {
  id: string;
  number: string;
  token: string;
  name: string;
  phone: string;
  status: string;
  ticket_url?: string | null;
};

type Step = "form" | "payment" | "done" | "waitlist" | "paid";

const STORAGE_KEY = "run_registration";

function loadSaved(): Saved | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Saved | null;
  } catch {
    return null;
  }
}

function save(value: Saved | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked in in-app browsers; the flow still works for this session.
  }
}

function stepFor(saved: Saved | null, receiptSent: boolean): Step {
  if (!saved) return "form";
  if (saved.status === "waitlist") return "waitlist";
  if ((saved.status === "paid" || saved.status === "ticket_sent") && saved.ticket_url) return "paid";
  if (saved.status === "cancelled") return "form";
  return receiptSent ? "done" : "payment";
}

export function FunnelModal({ state, onClose }: { state: PublicState; onClose: () => void }) {
  const { event, settings } = state;
  const [saved, setSaved] = useState<Saved | null>(null);
  const [step, setStep] = useState<Step>("form");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = loadSaved();
    const receiptSent = localStorage.getItem(`${STORAGE_KEY}_receipt`) === "1";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(existing);
    setStep(stepFor(existing, receiptSent));
    if (existing) {
      fetch(`/api/registrations/${existing.id}?token=${existing.token}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { registration?: Saved } | null) => {
          if (!data?.registration) {
            save(null);
            setSaved(null);
            setStep("form");
            return;
          }
          save(data.registration);
          setSaved(data.registration);
          setStep(stepFor(data.registration, receiptSent));
        })
        .catch(() => undefined);
    }
    track("registration_started");
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (step === "payment" && saved) {
      track("payment_screen_opened");
      fetch(`/api/registrations/${saved.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: saved.token, event: "payment_screen_opened" }),
      }).catch(() => undefined);
    }
  }, [step, saved]);

  const stepIndex = step === "form" ? 1 : step === "payment" ? 2 : 3;
  const price = formatPrice(event.price, event.currency);

  const receiptHref = saved
    ? whatsappLink(
        settings.whatsapp_number,
        fillTemplate(settings.whatsapp_message_template, templateValues(event, { ...saved, ticket_url: null })),
      )
    : whatsappLink(settings.whatsapp_number);

  function onReceiptClick() {
    if (!saved) return;
    track("whatsapp_receipt_click");
    fetch(`/api/registrations/${saved.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: saved.token, event: "whatsapp_receipt_click" }),
      keepalive: true,
    }).catch(() => undefined);
    try {
      localStorage.setItem(`${STORAGE_KEY}_receipt`, "1");
    } catch {}
    setTimeout(() => setStep("done"), 400);
  }

  function reset() {
    save(null);
    try {
      localStorage.removeItem(`${STORAGE_KEY}_receipt`);
    } catch {}
    setSaved(null);
    setStep("form");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <button
        aria-label="Закрыть"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="funnel-title"
        className="grunge rise relative max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl border border-cyan/30 bg-deep px-5 pb-8 pt-5 outline-none sm:max-w-md sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <Stepper current={stepIndex} />
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-xl leading-none hover:bg-white/20"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {step === "form" ? (
          <RegistrationStep
            state={state}
            onDone={(registration) => {
              save(registration);
              setSaved(registration);
              track("registration_completed", { number: registration.number });
              setStep(registration.status === "waitlist" ? "waitlist" : "payment");
            }}
          />
        ) : null}

        {step === "payment" && saved ? (
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-cyan">Шаг 2 из 3</p>
            <h2 id="funnel-title" className="mt-1 font-display text-2xl font-black leading-tight">
              Оплатите {price} через Kaspi
            </h2>
            {state.paymentAvailable ? (
              <>
                {settings.kaspi_pay_link ? (
                  <a
                    href={settings.kaspi_pay_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("kaspi_pay_click")}
                    className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#F14635] px-4 text-center font-display text-base font-black uppercase text-white shadow-[0_10px_30px_-8px_rgba(241,70,53,.7)] hover:brightness-110"
                  >
                    Оплатить {price} в Kaspi
                  </a>
                ) : null}
                <div className="mx-auto mt-5 w-full max-w-[220px] rounded-2xl bg-white p-3 glow sm:max-w-[260px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.kaspi_qr_key ? (fileUrl(settings.kaspi_qr_key) ?? "") : "/api/pay-qr"}
                    alt="Kaspi QR для оплаты"
                    className="aspect-square w-full object-contain"
                  />
                </div>
                {settings.kaspi_pay_link ? (
                  <p className="mt-2 text-center text-xs text-mist">С компьютера — отсканируйте QR в приложении Kaspi</p>
                ) : null}
                <ol className="mt-5 grid grid-cols-2 gap-2 text-sm">
                  {(settings.kaspi_pay_link
                    ? ["Нажмите «Оплатить в Kaspi»", `Оплатите ${price}`, "Сохраните чек", "Отправьте чек в WhatsApp"]
                    : ["Откройте Kaspi", "Отсканируйте QR", `Оплатите ${price}`, "Отправьте чек в WhatsApp"]
                  ).map(
                    (text, i) => (
                      <li key={text} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-electric text-xs font-black text-night">
                          {i + 1}
                        </span>
                        {text}
                      </li>
                    ),
                  )}
                </ol>
                {settings.payment_instructions ? (
                  <p className="mt-3 text-sm text-mist">{settings.payment_instructions}</p>
                ) : null}
                <a
                  href={receiptHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onReceiptClick}
                  className="cta mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-4 text-center font-display text-base font-black uppercase text-night"
                >
                  <WhatsAppIcon /> Отправить чек в WhatsApp
                </a>
                <p className="mt-3 text-center text-xs text-mist">
                  Оплата подтверждается вручную после проверки чека.
                </p>
              </>
            ) : (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <p className="font-bold">Оплата временно недоступна. Напишите нам в WhatsApp.</p>
                <p className="mt-2 text-sm text-mist">Ваша заявка #{saved.number} сохранена.</p>
                <a
                  href={receiptHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta mt-4 flex min-h-14 items-center justify-center gap-2 rounded-2xl font-display font-black uppercase text-night"
                >
                  <WhatsAppIcon /> Написать в WhatsApp
                </a>
              </div>
            )}
          </div>
        ) : null}

        {step === "done" && saved ? (
          <div className="text-center">
            <div className="text-5xl" aria-hidden>
              ✅
            </div>
            <h2 id="funnel-title" className="mt-3 font-display text-3xl font-black">
              Заявка принята
            </h2>
            <p className="mt-3 text-mist">{settings.confirmation_text}</p>
            <p className="mt-5 inline-block rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-2 font-display text-lg font-black tracking-wider">
              Номер заявки #{saved.number}
            </p>
            <a
              href={receiptHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onReceiptClick}
              className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 font-bold hover:bg-white/10"
            >
              <WhatsAppIcon /> Открыть WhatsApp ещё раз
            </a>
            <button type="button" onClick={() => setStep("payment")} className="mt-3 text-sm text-mist underline">
              Вернуться к QR
            </button>
          </div>
        ) : null}

        {step === "paid" && saved ? (
          <div className="text-center">
            <div className="text-5xl" aria-hidden>
              🎟️
            </div>
            <h2 id="funnel-title" className="mt-3 font-display text-3xl font-black">
              Оплата подтверждена
            </h2>
            <p className="mt-3 text-mist">Администратор проверил чек. Ваш билет готов.</p>
            <a
              href={saved.ticket_url ?? "#"}
              className="cta mt-6 flex min-h-14 items-center justify-center rounded-2xl font-display font-black uppercase text-night"
            >
              Открыть билет
            </a>
          </div>
        ) : null}

        {step === "waitlist" && saved ? (
          <div className="text-center">
            <h2 id="funnel-title" className="font-display text-3xl font-black">
              Вы в листе ожидания
            </h2>
            <p className="mt-3 text-mist">
              Все места сейчас заняты. Если место освободится, мы напишем вам в WhatsApp.
            </p>
            <p className="mt-5 inline-block rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-2 font-display font-black">
              Заявка #{saved.number}
            </p>
          </div>
        ) : null}

        {saved && step !== "form" ? (
          <button type="button" onClick={reset} className="mt-6 block w-full text-center text-xs text-mist/70 underline">
            Оформить новую заявку
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  const steps = ["Запись", "Оплата", "Билет"];
  return (
    <ol className="flex items-center gap-1.5 text-xs font-bold sm:text-sm" aria-label="Этапы">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <li key={label} className="flex items-center gap-1.5">
            <span
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                active ? "bg-electric text-night" : done ? "bg-cyan/20 text-cyan" : "bg-white/5 text-mist"
              }`}
            >
              {done ? "✓" : n} {label}
            </span>
            {n < steps.length ? <span className="text-mist/50">→</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

function RegistrationStep({ state, onDone }: { state: PublicState; onDone: (r: Saved) => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      occupation: String(form.get("occupation") || "").trim(),
      consent: form.get("consent") === "on",
      website: String(form.get("website") || ""),
      ...captureUtm(),
    };

    const errors: Record<string, string> = {};
    if (payload.name.length < 2) errors.name = "Введите имя";
    if (payload.phone.replace(/\D/g, "").length < 10) errors.phone = "Введите номер WhatsApp";
    if (!payload.consent) errors.consent = "Нужно согласие на обработку данных";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok: boolean; message?: string; registration?: Saved };
      if (!res.ok || !data.ok || !data.registration) {
        setError(data.message || "Не удалось отправить заявку");
        return;
      }
      onDone(data.registration);
    } catch {
      setError("Нет соединения. Проверьте интернет и попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  const input =
    "mt-1.5 block min-h-12 w-full rounded-xl border border-white/15 bg-night/70 px-4 text-base text-white placeholder:text-white/35 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/40";

  return (
    <form onSubmit={submit} noValidate>
      <p className="text-sm font-bold uppercase tracking-widest text-cyan">Шаг 1 из 3</p>
      <h2 id="funnel-title" className="mt-1 font-display text-2xl font-black leading-tight">
        {state.soldOut ? "Встать в лист ожидания" : "Оставьте заявку"}
      </h2>
      <p className="mt-1 text-sm text-mist">
        {state.event.name} · {state.event.event_type} · {formatPrice(state.event.price, state.event.currency)}
      </p>

      <label className="mt-5 block text-sm font-semibold">
        Имя
        <input name="name" autoComplete="given-name" className={input} placeholder="Как к вам обращаться" aria-invalid={Boolean(fieldErrors.name)} />
        {fieldErrors.name ? <span className="mt-1 block text-sm text-red-400">{fieldErrors.name}</span> : null}
      </label>

      <label className="mt-4 block text-sm font-semibold">
        Телефон / WhatsApp
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className={input}
          placeholder="+7 777 123 45 67"
          aria-invalid={Boolean(fieldErrors.phone)}
        />
        {fieldErrors.phone ? <span className="mt-1 block text-sm text-red-400">{fieldErrors.phone}</span> : null}
      </label>

      <label className="mt-4 block text-sm font-semibold">
        Чем занимаетесь? <span className="font-normal text-mist">— по желанию</span>
        <input name="occupation" className={input} placeholder="Например: предприниматель" />
      </label>

      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <label className="mt-4 flex items-start gap-3 text-sm">
        <input name="consent" type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[#00AEEF]" />
        <span>
          Согласен на обработку данных{" "}
          <a href="/privacy" target="_blank" className="text-cyan underline">
            (подробнее)
          </a>
          {fieldErrors.consent ? <span className="mt-1 block text-red-400">{fieldErrors.consent}</span> : null}
        </span>
      </label>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="cta mt-5 flex min-h-14 w-full items-center justify-center rounded-2xl font-display text-lg font-black uppercase text-night disabled:opacity-60"
      >
        {pending ? "Отправляем…" : "Оставить заявку"}
      </button>
    </form>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}
