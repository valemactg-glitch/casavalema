import { clsx } from "clsx";
import type { ElementType, ReactNode } from "react";

export function Section({
  children,
  className,
  bleed = false,
  tone = "marfil",
  as: As = "section" as ElementType,
  id,
}: {
  children: ReactNode;
  className?: string;
  bleed?: boolean;
  tone?: "marfil" | "white" | "carbon";
  as?: ElementType;
  id?: string;
}) {
  return (
    <As
      id={id}
      className={clsx(
        "section-y",
        tone === "white" && "bg-white",
        tone === "carbon" && "bg-carbon text-marfil",
        className,
      )}
    >
      <div className={clsx(!bleed && "shell")}>{children}</div>
    </As>
  );
}

/** Cabecera de página interior con el offset del header fijo. */
export function PageIntro({
  kicker,
  title,
  intro,
  children,
}: {
  kicker?: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="bg-marfil pt-24 pb-6">
      <div className="shell">
        {kicker && <p className="kicker mb-3">{kicker}</p>}
        <h1 className="text-[clamp(1.9rem,5vw,2.6rem)]">{title}</h1>
        {intro && (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">{intro}</p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
