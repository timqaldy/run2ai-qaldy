"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { captureUtm, track } from "@/lib/analytics";
import type { PublicState } from "@/lib/service";
import { FunnelModal } from "./FunnelModal";

type Ctx = { open: (source: string) => void; state: PublicState };

const FunnelContext = createContext<Ctx | null>(null);

export function useFunnel() {
  const ctx = useContext(FunnelContext);
  if (!ctx) throw new Error("useFunnel outside FunnelProvider");
  return ctx;
}

export function FunnelProvider({ state, children }: { state: PublicState; children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    captureUtm();
    track("page_view");
  }, []);

  const open = useCallback((source: string) => {
    track("cta_click", { source });
    setOpen(true);
  }, []);

  return (
    <FunnelContext.Provider value={{ open, state }}>
      {children}
      {isOpen ? <FunnelModal state={state} onClose={() => setOpen(false)} /> : null}
    </FunnelContext.Provider>
  );
}
