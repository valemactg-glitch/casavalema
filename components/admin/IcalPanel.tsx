"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/admin/ui";
import { sincronizarIcal, guardarEnlaceIcal } from "@/app/admin/(panel)/calendario/actions";

type Row = {
  roomId: string;
  nombre: string;
  urlEntrada: string | null;
  tokenSalida: string;
  ultimaSync: string | null;
  ultimoResultado: string | null;
  eventos: number;
};

function tono(resultado: string | null): "exito" | "aviso" | "error" | "neutro" {
  if (!resultado) return "neutro";
  if (/al día/i.test(resultado)) return "exito";
  if (/solapamiento|conflicto|error|404/i.test(resultado)) return "error";
  if (/sin enlace|pendiente/i.test(resultado)) return "aviso";
  return "neutro";
}

export function IcalPanel({ rows, siteUrl }: { rows: Row[]; siteUrl: string }) {
  const [editar, setEditar] = useState<string | null>(null);

  return (
    <div>
      <p className="mb-3 text-[12px] leading-relaxed text-ink-2">
        La sincronización iCal no es instantánea: Airbnb consulta el enlace cada pocas horas.
        El bloqueo manual sigue siendo el respaldo cuando la fecha es crítica.
      </p>
      <ul className="divide-y divide-hairline">
        {rows.map((r) => (
          <li key={r.roomId} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-carbon">{r.nombre}</p>
                <p className="text-[11.5px] text-ink-3">
                  {r.ultimaSync
                    ? `Importado ${r.ultimaSync} · ${r.eventos} evento${r.eventos === 1 ? "" : "s"}`
                    : "Nunca sincronizado"}
                </p>
              </div>
              <Pill tone={tono(r.ultimoResultado)}>{r.ultimoResultado ?? "Pendiente"}</Pill>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <form action={sincronizarIcal}>
                <input type="hidden" name="roomId" value={r.roomId} />
                <Button type="submit" size="sm" variant="outline">
                  Sincronizar ahora
                </Button>
              </form>
              <button
                onClick={() => setEditar(editar === r.roomId ? null : r.roomId)}
                className="text-[12px] text-ink-2 underline hover:text-carbon"
              >
                {r.urlEntrada ? "Editar enlace de Airbnb" : "Agregar enlace de Airbnb"}
              </button>
              <a
                href={`${siteUrl}/api/ical/${r.tokenSalida}`}
                className="text-[12px] text-ink-2 underline hover:text-carbon"
              >
                Enlace para exportar a Airbnb
              </a>
            </div>
            {editar === r.roomId && (
              <form action={guardarEnlaceIcal} className="mt-2 flex gap-2">
                <input type="hidden" name="roomId" value={r.roomId} />
                <input
                  name="url"
                  defaultValue={r.urlEntrada ?? ""}
                  placeholder="https://www.airbnb.com/calendar/ical/…"
                  className="h-9 flex-1 rounded-sm border border-hairline px-3 text-[12px]"
                />
                <Button type="submit" size="sm" variant="primary">
                  Guardar
                </Button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-ink-3">
        Historial de sincronización disponible en cada habitación. Los conflictos se
        resuelven a mano: nunca se cancela una reserva automáticamente.
      </p>
    </div>
  );
}
