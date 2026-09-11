import { clsx } from "clsx";
import type { ComponentProps, ReactNode } from "react";

/**
 * Campos SSR-safe (sin hooks): el `id` sale de `name` o de `id` explícito,
 * así funcionan igual en formularios con y sin JavaScript.
 */

const controlBase =
  "w-full rounded-sm border bg-white px-3.5 text-[13.5px] text-ink placeholder:text-ink-3/70 transition-colors focus:border-oro focus:outline-none disabled:bg-neutro-bg/60 aria-[invalid=true]:border-error-fg";

function Wrap({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-[12px] font-medium text-ink-2">
        {label}
        {required && <span className="ml-0.5 text-error-fg">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[11.5px] text-error-fg">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[11.5px] text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type Base = {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  wrapClassName?: string;
};

type FieldProps = Omit<ComponentProps<"input">, "name"> & Base & { name: string };

export function Field({ label, hint, error, wrapClassName, className, required, name, id, ...rest }: FieldProps) {
  const fid = id ?? name;
  return (
    <Wrap id={fid} label={label} hint={hint} error={error} required={required} className={wrapClassName}>
      <input
        id={fid}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
        className={clsx(controlBase, "h-11", className)}
        {...rest}
      />
    </Wrap>
  );
}

type SelectProps = Omit<ComponentProps<"select">, "name"> & Base & { name: string };

export function SelectField({
  label,
  hint,
  error,
  wrapClassName,
  className,
  required,
  name,
  id,
  children,
  ...rest
}: SelectProps) {
  const fid = id ?? name;
  return (
    <Wrap id={fid} label={label} hint={hint} error={error} required={required} className={wrapClassName}>
      <select
        id={fid}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
        className={clsx(
          controlBase,
          "h-11 appearance-none bg-[right_0.85rem_center] bg-no-repeat pr-9",
          className,
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%234a5462' stroke-width='1.6'><path d='M2 4l4 4 4-4'/></svg>\")",
        }}
        {...rest}
      >
        {children}
      </select>
    </Wrap>
  );
}

type TextareaProps = Omit<ComponentProps<"textarea">, "name"> & Base & { name: string };

export function TextareaField({
  label,
  hint,
  error,
  wrapClassName,
  className,
  required,
  name,
  id,
  ...rest
}: TextareaProps) {
  const fid = id ?? name;
  return (
    <Wrap id={fid} label={label} hint={hint} error={error} required={required} className={wrapClassName}>
      <textarea
        id={fid}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
        className={clsx(controlBase, "min-h-24 py-2.5 leading-relaxed", className)}
        {...rest}
      />
    </Wrap>
  );
}

type CheckboxProps = Omit<ComponentProps<"input">, "type" | "name"> & {
  label: ReactNode;
  error?: ReactNode;
  name: string;
};

export function CheckboxField({ label, error, className, name, id, ...rest }: CheckboxProps) {
  const fid = id ?? name;
  return (
    <div className="space-y-1">
      <label htmlFor={fid} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-2">
        <input
          id={fid}
          name={name}
          type="checkbox"
          className={clsx("mt-0.5 size-4 shrink-0 rounded-[4px] accent-carbon", className)}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        <span>{label}</span>
      </label>
      {error && <p className="pl-[26px] text-[11.5px] text-error-fg">{error}</p>}
    </div>
  );
}
