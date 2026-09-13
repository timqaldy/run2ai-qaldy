"use client";

import { useState } from "react";

export function TicketActions({ code }: { code: string }) {
  const [busy, setBusy] = useState(false);

  async function downloadPng() {
    const svg = document.querySelector("main svg");
    if (!svg) return;
    setBusy(true);
    try {
      const data = new XMLSerializer().serializeToString(svg);
      const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml;charset=utf-8" }));
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 1440;
      canvas.height = 2160;
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.download = `ticket-${code}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="no-print mt-6 grid w-full grid-cols-2 gap-3">
      <button
        type="button"
        onClick={downloadPng}
        disabled={busy}
        className="cta min-h-14 rounded-2xl font-display font-black uppercase text-night disabled:opacity-60"
      >
        Скачать PNG
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="min-h-14 rounded-2xl border border-white/20 font-display font-black uppercase hover:bg-white/10"
      >
        Скачать PDF
      </button>
    </div>
  );
}
