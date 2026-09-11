"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const KEY = "valema_cookies_v1";

export function CookiePreferences() {
  const [value, setValue] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = localStorage.getItem(KEY);
      setValue(raw ? JSON.parse(raw).value : null);
    } catch {
      setValue(null);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function decide(v: "todas" | "esenciales") {
    try {
      localStorage.setItem(KEY, JSON.stringify({ value: v, ts: Date.now() }));
    } catch {
      /* noop */
    }
    setValue(v);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="rounded-lg border border-hairline bg-white p-5">
      <p className="text-[13px] font-semibold text-carbon">Tus preferencias de cookies</p>
      <p className="mt-1 text-[12.5px] text-ink-2">
        Estado actual:{" "}
        <span className="font-medium text-carbon">
          {value === "todas"
            ? "aceptaste todas las cookies"
            : value === "esenciales"
              ? "solo cookies esenciales"
              : "sin elección guardada"}
        </span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => decide("esenciales")}>
          Solo esenciales
        </Button>
        <Button size="sm" variant="primary" onClick={() => decide("todas")}>
          Aceptar todas
        </Button>
        {saved && <span className="self-center text-[12px] text-exito-fg">Guardado ✓</span>}
      </div>
    </div>
  );
}
