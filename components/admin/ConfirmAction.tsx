"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  trigger: string;
  title: string;
  /** Consecuencias enumeradas: habitación, fechas, reservas afectadas, disponibilidad resultante. */
  consecuencias: { k: string; v: string }[];
  aviso?: string;
  confirmar: string;
  hidden?: Record<string, string>;
  tone?: "danger" | "primary";
  size?: "sm" | "md";
  disabled?: boolean;
};

export function ConfirmAction({
  action,
  trigger,
  title,
  consecuencias,
  aviso,
  confirmar,
  hidden,
  tone = "primary",
  size = "sm",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button
        variant={tone === "danger" ? "danger" : "outline"}
        size={size}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {trigger}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          ref={ref as never}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-carbon/45 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-floating">
            <h3 className="text-[16px]">{title}</h3>
            <dl className="mt-3 divide-y divide-hairline rounded-md border border-hairline text-[12.5px]">
              {consecuencias.map((c) => (
                <div key={c.k} className="flex justify-between gap-4 px-3 py-2">
                  <dt className="text-ink-3">{c.k}</dt>
                  <dd className="text-right font-medium text-carbon">{c.v}</dd>
                </div>
              ))}
            </dl>
            {aviso && (
              <p
                className={clsx(
                  "mt-3 rounded-md px-3 py-2 text-[12px]",
                  tone === "danger" ? "bg-error-soft-bg text-error-fg" : "bg-aviso-bg text-aviso-fg",
                )}
              >
                {aviso}
              </p>
            )}
            <form
              action={action}
              className="mt-4 flex justify-end gap-2"
              onSubmit={() => setOpen(false)}
            >
              {hidden &&
                Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <SubmitButton tone={tone} label={confirmar} />
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SubmitButton({ tone, label }: { tone: "danger" | "primary"; label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={tone === "danger" ? "danger" : "primary"} size="sm" loading={pending}>
      {label}
    </Button>
  );
}
