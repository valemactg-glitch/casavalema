import Link from "next/link";
import { clsx } from "clsx";
import { BrandMark } from "./BrandLogo";

/** Logotipo compacto: emblema del manual de marca + nombre. */
export function Logo({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={clsx("group inline-flex items-center gap-2.5", className)}
      aria-label="Casa Turística Valema — inicio"
    >
      <BrandMark size={38} className="transition-transform group-hover:scale-105" />
      <span className="inline-flex flex-col leading-none">
        <span
          className={clsx(
            "font-heading text-[19px]",
            tone === "light" ? "text-marfil" : "text-carbon",
          )}
        >
          Valema
        </span>
        <span className="mt-0.5 text-[8.5px] font-semibold uppercase tracking-[0.24em] text-oro-texto">
          Casa turística
        </span>
      </span>
    </Link>
  );
}
