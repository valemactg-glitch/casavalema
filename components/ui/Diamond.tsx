import { clsx } from "clsx";

/** Rombo dorado de 9px — la marca decorativa del sistema, en vez de iconos. */
export function Diamond({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={clsx("inline-block size-[9px] rotate-45 bg-oro", className)}
    />
  );
}
