export type TrackingEvent =
  | "page_view"
  | "cta_click"
  | "registration_started"
  | "registration_completed"
  | "payment_screen_opened"
  | "whatsapp_receipt_click"
  | "kaspi_pay_click"
  | "payment_confirmed"
  | "ticket_sent";

const META_MAP: Partial<Record<TrackingEvent, string>> = {
  page_view: "PageView",
  registration_started: "InitiateCheckout",
  registration_completed: "Lead",
  payment_screen_opened: "AddPaymentInfo",
};

type PosthogLike = { capture: (e: string, p?: object) => void; identify: (id: string) => void };

export function identify(distinctId: string) {
  if (typeof window === "undefined") return;
  (window as Window & { posthog?: PosthogLike }).posthog?.identify(distinctId);
}

export function track(event: TrackingEvent, props: Record<string, string | number> = {}) {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    posthog?: PosthogLike;
  };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...props });
  w.gtag?.("event", event, props);
  if (event !== "page_view") w.posthog?.capture(event, props);
  const meta = META_MAP[event];
  if (meta) w.fbq?.("track", meta, props);
  else w.fbq?.("trackCustom", event, props);
}

const UTM_KEY = "run_utm";

export function captureUtm() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const fresh: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
    const value = params.get(key);
    if (value) fresh[key] = value.slice(0, 120);
  }
  if (document.referrer && !document.referrer.startsWith(window.location.origin)) {
    fresh.referrer = document.referrer.slice(0, 300);
  }
  try {
    const stored = JSON.parse(localStorage.getItem(UTM_KEY) || "{}") as Record<string, string>;
    const merged = { ...stored, ...fresh };
    localStorage.setItem(UTM_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return fresh;
  }
}
