import { clsx } from "clsx";
import type { ReactNode } from "react";

type Tone = "exito" | "aviso" | "pendiente" | "error" | "error-soft" | "info" | "neutro" | "oro";

const tones: Record<Tone, string> = {
  exito: "bg-exito-bg text-exito-fg",
  aviso: "bg-aviso-bg text-aviso-fg",
  pendiente: "bg-pendiente-bg text-pendiente-fg",
  error: "bg-error-bg text-error-fg",
  "error-soft": "bg-error-soft-bg text-error-fg",
  info: "bg-info-bg text-info-fg",
  neutro: "bg-neutro-bg text-neutro-fg",
  oro: "bg-[#fff6dc] text-[#8a6a0b]",
};

export function Badge({
  tone = "neutro",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-pill px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
