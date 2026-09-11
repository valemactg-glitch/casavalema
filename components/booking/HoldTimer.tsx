"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

export function HoldTimer({
  expiraEn,
  onExpire,
  inline,
}: {
  expiraEn: string;
  onExpire?: () => void;
  inline?: boolean;
}) {
  const [restante, setRestante] = useState(() => Math.max(0, new Date(expiraEn).getTime() - Date.now()));
  const fired = useRef(false);

  useEffect(() => {
    fired.current = false;
    const target = new Date(expiraEn).getTime();
    const tick = () => {
      const r = Math.max(0, target - Date.now());
      setRestante(r);
      if (r === 0 && !fired.current) {
        fired.current = true;
        onExpire?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiraEn, onExpire]);

  const mm = Math.floor(restante / 60000);
  const ss = Math.floor((restante % 60000) / 1000);
  const texto = `${mm}:${String(ss).padStart(2, "0")}`;
  const urgente = restante < 120000;

  if (inline) {
    return (
      <span className={clsx("font-semibold tabular-nums", urgente && "text-error-fg")}>
        {restante > 0 ? texto : "expirado"}
      </span>
    );
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[12px] font-semibold tabular-nums",
        urgente ? "bg-error-soft-bg text-error-fg" : "bg-pendiente-bg text-pendiente-fg",
      )}
    >
      {restante > 0 ? `Quedan ${texto}` : "Retención expirada"}
    </span>
  );
}
