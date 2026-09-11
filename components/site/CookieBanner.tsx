"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const KEY = "valema_cookies_v1";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      // El estado sólo se conoce en el cliente (localStorage).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      /* modo privado */
    }
  }, []);

  function decide(value: "todas" | "esenciales") {
    try {
      localStorage.setItem(KEY, JSON.stringify({ value, ts: Date.now() }));
    } catch {
      /* noop */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Preferencias de cookies"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-md border border-hairline bg-white p-4 shadow-floating sm:inset-x-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12.5px] leading-relaxed text-ink-2">
          Usamos cookies esenciales para que el sitio funcione y, si lo aceptas,
          cookies de medición para mejorar la experiencia. Puedes cambiar tu
          decisión cuando quieras.{" "}
          <Link href="/legales/politica-de-cookies" className="underline">
            Más información
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={() => decide("esenciales")}>
            Solo esenciales
          </Button>
          <Button size="sm" variant="primary" onClick={() => decide("todas")}>
            Aceptar todas
          </Button>
        </div>
      </div>
    </div>
  );
}
