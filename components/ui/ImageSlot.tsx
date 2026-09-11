import Image from "next/image";
import { clsx } from "clsx";

/**
 * Marco de imagen. Cuando `src` está vacío muestra un marcador con la
 * descripción de lo que corresponde; toda imagen se administra desde la
 * Galería / el editor de habitación.
 */
export function ImageSlot({
  src,
  alt,
  ratio = "4/3",
  className,
  priority,
  sizes = "(max-width: 640px) 100vw, 50vw",
}: {
  src?: string | null;
  alt: string;
  ratio?: `${number}/${number}` | "cover";
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const aspect = ratio === "cover" ? undefined : { aspectRatio: ratio.replace("/", " / ") };

  if (src) {
    if (ratio === "cover") {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={clsx("object-cover", className)}
        />
      );
    }
    return (
      <div className={clsx("relative overflow-hidden", className)} style={aspect}>
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
      </div>
    );
  }

  if (ratio === "cover") {
    return (
      <div
        role="img"
        aria-label={alt}
        className={clsx("absolute inset-0 h-full w-full overflow-hidden", className)}
        style={{
          background:
            "radial-gradient(120% 90% at 30% 20%, #24344a 0%, #1d2a3a 55%, #131d29 100%)",
        }}
      >
        <span className="absolute bottom-3 left-3 rounded-pill bg-black/25 px-2.5 py-1 text-[10.5px] text-marfil/70 backdrop-blur-sm">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      style={aspect}
      className={clsx(
        "flex items-center justify-center overflow-hidden border border-hairline bg-surface-warm",
        className,
      )}
    >
      <span className="flex flex-col items-center gap-2 px-6 py-8 text-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-ink-3/60" aria-hidden="true">
          <rect x="3" y="4.5" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="8.5" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.4" />
          <path d="M4 17l4.5-4.5L13 16l3-3 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="max-w-[26ch] text-[11.5px] leading-snug text-ink-3">{alt}</span>
      </span>
    </div>
  );
}
