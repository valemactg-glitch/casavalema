import { clsx } from "clsx";
import type { ElementType, ReactNode } from "react";

export function Card({
  as: As = "div" as ElementType,
  elevated,
  className,
  children,
}: {
  as?: ElementType;
  elevated?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <As
      className={clsx(
        "rounded-lg border border-hairline bg-white",
        elevated ? "shadow-elevated" : "shadow-card",
        className,
      )}
    >
      {children}
    </As>
  );
}
