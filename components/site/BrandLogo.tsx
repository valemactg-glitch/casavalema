import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";

/**
 * Marca de Casa Turística Valema.
 * `mark`  → emblema recortado (casa + bugambilia) para cabeceras compactas.
 * `full`  → lockup completo (emblema + nombre + descriptor) para pie y accesos.
 * El archivo `public/valema-logo.jpg` es el logo del manual de marca.
 */

export function BrandMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={clsx("block shrink-0 rounded-full bg-marfil ring-1 ring-oro/30", className)}
      style={{
        width: size,
        height: size,
        backgroundImage: "url('/valema-logo.jpg')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "190% auto",
        backgroundPosition: "50% 34%",
      }}
    />
  );
}

export function BrandLogo({
  variant = "mark",
  tone = "dark",
  href = "/",
  className,
}: {
  variant?: "mark" | "full";
  tone?: "dark" | "light";
  href?: string | null;
  className?: string;
}) {
  const content =
    variant === "full" ? (
      <Image
        src="/valema-logo.jpg"
        alt="Casa Turística Valema"
        width={2816}
        height={1536}
        className="h-auto w-full"
      />
    ) : (
      <span className="inline-flex items-center gap-2.5">
        <BrandMark size={38} />
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
      </span>
    );

  if (href === null) return <span className={className}>{content}</span>;

  return (
    <Link
      href={href}
      aria-label="Casa Turística Valema — inicio"
      className={clsx("inline-flex items-center", className)}
    >
      {content}
    </Link>
  );
}
