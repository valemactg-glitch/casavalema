"use client";

import { clsx } from "clsx";
import { formatCOP } from "@/lib/format";
import { formatRangeEs, nightsLabel, guestsLabel } from "@/lib/dates";
import { parseISODate } from "@/lib/dates";
import { cobroLabel } from "@/lib/booking/pricing";
import type { ClientQuote } from "@/lib/booking/clientQuote";

export type SummaryServicio = {
  id: string;
  nombre: string;
  precio: number;
  tipoCobro: string;
  cantidad: number;
  subtotal: number;
  bajoSolicitud: boolean;
};

export function BookingSummary({
  nombre,
  llegada,
  salida,
  adultos,
  ninos,
  quote,
  servicios,
  planNombre,
  reembolsable,
  anticipoPct,
  className,
  compact,
}: {
  nombre: string;
  llegada: string;
  salida: string;
  adultos: number;
  ninos: number;
  quote: ClientQuote | null;
  servicios: SummaryServicio[];
  planNombre: string;
  reembolsable: boolean;
  anticipoPct: number;
  className?: string;
  compact?: boolean;
}) {
  const l = parseISODate(llegada);
  const s = parseISODate(salida);
  const serviciosTotal = servicios.filter((x) => !x.bajoSolicitud).reduce((a, x) => a + x.subtotal, 0);
  const total = (quote?.total ?? 0) + serviciosTotal;
  const pct = reembolsable ? anticipoPct : 100;
  const anticipo = quote ? (pct >= 100 ? total : Math.round((total * pct) / 100 / 100) * 100) : 0;

  return (
    <div className={clsx("rounded-lg border border-hairline bg-white p-5", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">Tu reserva</p>
      <p className="mt-1.5 font-heading text-[19px] text-carbon">{nombre}</p>
      <p className="text-[12.5px] text-ink-2">
        {l && s ? formatRangeEs(l, s) : "—"} · {quote ? nightsLabel(quote.noches) : ""}
      </p>
      <p className="text-[12.5px] text-ink-3">{guestsLabel(adultos, ninos)}</p>
      <p className="mt-1 text-[11.5px] text-ink-3">Tarifa: {planNombre}</p>

      <dl className="mt-4 space-y-1.5 border-t border-hairline pt-3 text-[12.5px]">
        {quote && (
          <div className="flex justify-between text-ink-2">
            <dt>
              {formatCOP(Math.round(quote.subtotal / Math.max(1, quote.noches)))} ×{" "}
              {nightsLabel(quote.noches)}
            </dt>
            <dd>{formatCOP(quote.subtotal)}</dd>
          </div>
        )}
        {quote && quote.descuento > 0 && (
          <div className="flex justify-between text-exito-fg">
            <dt>Descuento tarifa</dt>
            <dd>−{formatCOP(quote.descuento)}</dd>
          </div>
        )}
        {servicios
          .filter((x) => !x.bajoSolicitud)
          .map((x) => (
            <div key={x.id} className="flex justify-between text-ink-2">
              <dt>
                {x.nombre}
                {x.cantidad > 1 && ` ×${x.cantidad}`}{" "}
                <span className="text-ink-3">{cobroLabel(x.tipoCobro)}</span>
              </dt>
              <dd>{formatCOP(x.subtotal)}</dd>
            </div>
          ))}
        {servicios
          .filter((x) => x.bajoSolicitud)
          .map((x) => (
            <div key={x.id} className="flex justify-between text-ink-3">
              <dt>{x.nombre}</dt>
              <dd>Bajo solicitud</dd>
            </div>
          ))}
        <div className="flex justify-between text-ink-2">
          <dt>Impuestos y cargos</dt>
          <dd>Incluidos</dd>
        </div>
        <div className="flex justify-between border-t border-hairline pt-2 text-[15px] font-semibold text-carbon">
          <dt>Total</dt>
          <dd>{formatCOP(total)}</dd>
        </div>
        {!compact && quote && (
          <>
            <div className="flex justify-between pt-1 text-ink-2">
              <dt>Anticipo hoy{reembolsable ? "" : " (pago total)"}</dt>
              <dd className="font-medium text-carbon">{formatCOP(anticipo)}</dd>
            </div>
            <div className="flex justify-between text-ink-2">
              <dt>Saldo al llegar</dt>
              <dd>{formatCOP(Math.max(0, total - anticipo))}</dd>
            </div>
          </>
        )}
      </dl>
    </div>
  );
}
