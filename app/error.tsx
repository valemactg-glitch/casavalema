"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { whatsappUrl } from "@/lib/nav";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="kicker">Algo falló</p>
      <h1 className="mt-2 text-[clamp(1.6rem,4vw,2.2rem)]">No pudimos cargar esta página</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-ink-2">
        Fue un problema de nuestro lado. Intenta de nuevo en un momento. Si estabas
        reservando y tienes dudas sobre un pago, escríbenos por WhatsApp y lo revisamos.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()} variant="primary">
          Reintentar
        </Button>
        <Button href="/" variant="outline">
          Ir al inicio
        </Button>
        <Button href={whatsappUrl()} variant="ghost">
          Escribir por WhatsApp
        </Button>
      </div>
      {error.digest && (
        <p className="mt-6 text-[11px] text-ink-3">Referencia del error: {error.digest}</p>
      )}
    </div>
  );
}
