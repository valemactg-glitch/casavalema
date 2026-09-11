import { clsx } from "clsx";
import type { ReactNode } from "react";
import { Diamond } from "./Diamond";

type Tone = "info" | "aviso" | "error" | "exito" | "neutro";

const tones: Record<Tone, string> = {
  info: "bg-info-bg text-info-fg",
  aviso: "bg-aviso-bg text-aviso-fg",
  error: "bg-error-soft-bg text-error-fg",
  exito: "bg-exito-bg text-exito-fg",
  neutro: "bg-neutro-bg text-neutro-fg",
};

export function Callout({
  tone = "info",
  title,
  children,
  action,
  className,
  role,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
  role?: "status" | "alert";
}) {
  return (
    <div
      role={role}
      className={clsx(
        "flex flex-col gap-3 rounded-md px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
        tones[tone],
        className,
      )}
    >
      <div className="flex gap-3">
        <Diamond className="mt-1 shrink-0 opacity-70" />
        <div className="space-y-1 text-[13px] leading-relaxed">
          {title && <p className="font-semibold">{title}</p>}
          {children && <div className="[&_a]:underline">{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
