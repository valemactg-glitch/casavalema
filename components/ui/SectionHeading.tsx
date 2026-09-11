import { clsx } from "clsx";
import type { ReactNode } from "react";

export function SectionHeading({
  kicker,
  title,
  intro,
  align = "start",
  as: As = "h2",
  className,
}: {
  kicker?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "start" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {kicker && <p className="kicker mb-3">{kicker}</p>}
      <As className="text-[clamp(1.6rem,4vw,2.05rem)]">{title}</As>
      {intro && (
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{intro}</p>
      )}
    </div>
  );
}
