"use client";

import { useEffect, useState } from "react";
import { useFunnel } from "@/components/funnel/FunnelProvider";
import { formatPrice } from "@/lib/format";

export function CtaButton({
  source,
  label,
  withPrice = false,
  className = "",
  inline = true,
}: {
  source: string;
  label?: string;
  withPrice?: boolean;
  className?: string;
  inline?: boolean;
}) {
  const { open, state } = useFunnel();
  const price = formatPrice(state.event.price, state.event.currency);
  const text = state.soldOut
    ? "Мест нет — встать в лист ожидания"
    : `${label ?? state.settings.cta_text}${withPrice ? ` — ${price}` : ""}`;

  return (
    <button
      type="button"
      onClick={() => open(source)}
      data-inline-cta={inline ? "" : undefined}
      className={`cta inline-flex min-h-14 items-center justify-center rounded-2xl px-6 text-center font-display text-base font-black uppercase tracking-wide text-night transition sm:text-lg ${className}`}
    >
      {text}
    </button>
  );
}

export function TextCta({ source, children }: { source: string; children: React.ReactNode }) {
  const { open } = useFunnel();
  return (
    <button
      type="button"
      onClick={() => open(source)}
      className="mt-6 inline-flex items-center gap-2 font-display text-lg font-black text-cyan hover:text-white"
    >
      {children}
    </button>
  );
}

export function StickyCta() {
  const [scrolled, setScrolled] = useState(false);
  const [inlineVisible, setInlineVisible] = useState(true);
  const visible = scrolled && !inlineVisible;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Hide the sticky button while any in-page signup button is on screen, so two identical CTAs never show at once.
    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      setInlineVisible(onScreen.size > 0);
    });
    document.querySelectorAll("[data-inline-cta]").forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className={`no-print fixed inset-x-0 bottom-0 z-40 border-t border-cyan/20 bg-night/90 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
      inert={!visible}
    >
      <CtaButton source="sticky" withPrice inline={false} className="w-full" />
    </div>
  );
}
