"use client";

import { useEffect, useState } from "react";

// Two-tap confirmation instead of window.confirm, which in-app and embedded browsers silently block.
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  disabled,
  className,
  armedClassName,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
  className: string;
  armedClassName: string;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!armed) return setArmed(true);
        setArmed(false);
        onConfirm();
      }}
      className={`${armed ? armedClassName : className} disabled:opacity-50`}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}
