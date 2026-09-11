import { clsx } from "clsx";
import type { ReactNode } from "react";

export function AdminHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[26px] leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[12.5px] text-ink-3">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={clsx("rounded-md border border-hairline bg-white", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3">
          {title && <h2 className="text-[14px] font-semibold text-carbon">{title}</h2>}
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      <div className={clsx(padded && "p-4")}>{children}</div>
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "warn" | "good";
}) {
  return (
    <div className="rounded-md border border-hairline bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">{label}</p>
      <p
        className={clsx(
          "mt-1 font-heading text-[24px] leading-tight",
          tone === "warn" ? "text-aviso-fg" : tone === "good" ? "text-exito-fg" : "text-carbon",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-ink-3">{hint}</p>}
    </div>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx("w-full min-w-[560px] text-left text-[12.5px]", className)}>{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={clsx("border-b border-hairline pb-2 pr-3 font-medium text-ink-3", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <td className={clsx("border-b border-hairline/70 py-2.5 pr-3 align-top text-carbon", className)}>
      {children}
    </td>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-hairline bg-white/60 px-6 py-10 text-center">
      <p className="text-[13.5px] font-medium text-carbon">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-[12px] text-ink-3">{children}</p>}
    </div>
  );
}

const PILLS: Record<string, string> = {
  exito: "bg-exito-bg text-exito-fg",
  aviso: "bg-aviso-bg text-aviso-fg",
  pendiente: "bg-pendiente-bg text-pendiente-fg",
  error: "bg-error-bg text-error-fg",
  info: "bg-info-bg text-info-fg",
  neutro: "bg-neutro-bg text-neutro-fg",
};

export function Pill({ tone = "neutro", children }: { tone?: keyof typeof PILLS; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex rounded-pill px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]", PILLS[tone])}>
      {children}
    </span>
  );
}

/** Marca de sólo lectura para roles sin permiso de escritura. */
export function ReadOnlyNote() {
  return (
    <p className="mb-4 rounded-md bg-neutro-bg px-3 py-2 text-[11.5px] text-neutro-fg">
      Tu rol permite ver esta sección pero no modificarla.
    </p>
  );
}
