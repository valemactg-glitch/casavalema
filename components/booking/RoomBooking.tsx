"use client";

import { useMemo, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Field";
import { formatCOP } from "@/lib/format";
import { nightsLabel } from "@/lib/dates";
import { reservarHref } from "@/lib/booking/links";
import {
  clientQuote,
  nightsInRange,
  type CalNight,
  type ClientPlan,
} from "@/lib/booking/clientQuote";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DOW = ["L", "M", "M", "J", "V", "S", "D"];

type Props = {
  slug: string;
  nombre: string;
  capacidadAdultos: number;
  capacidadNinos: number;
  calendar: CalNight[];
  ratePlans: ClientPlan[];
  defaults: { llegada: string; salida: string; adultos: number; ninos: number };
  children: ReactNode;
};

export function RoomBooking({
  slug,
  nombre,
  capacidadAdultos,
  capacidadNinos,
  calendar,
  ratePlans,
  defaults,
  children,
}: Props) {
  const [llegada, setLlegada] = useState(defaults.llegada);
  const [salida, setSalida] = useState(defaults.salida);
  const [adultos, setAdultos] = useState(defaults.adultos);
  const [ninos, setNinos] = useState(defaults.ninos);
  const [planId, setPlanId] = useState(
    ratePlans.find((p) => p.reembolsable)?.id ?? ratePlans[0]?.id ?? "",
  );

  const plan = ratePlans.find((p) => p.id === planId) ?? ratePlans[0] ?? null;
  const quote = useMemo(
    () => clientQuote(calendar, llegada, salida, plan),
    [calendar, llegada, salida, plan],
  );

  const seleccion = useMemo(
    () => new Set(llegada && salida && salida > llegada ? nightsInRange(llegada, salida) : []),
    [llegada, salida],
  );

  function onPick(fecha: string, disponible: boolean) {
    if (!disponible) return;
    if (!llegada || (llegada && salida) || fecha <= llegada) {
      setLlegada(fecha);
      setSalida("");
      return;
    }
    // fecha > llegada: comprobar que el tramo no cruce noches ocupadas
    const tramo = nightsInRange(llegada, fecha);
    const byDate = new Map(calendar.map((c) => [c.fecha, c]));
    const cruza = tramo.some((f) => {
      const c = byDate.get(f);
      return !c || !c.disponible;
    });
    if (cruza) {
      setLlegada(fecha);
      setSalida("");
    } else {
      setSalida(fecha);
    }
  }

  const meses = useMemo(() => groupByMonth(calendar), [calendar]);
  const capacidadOk = adultos <= capacidadAdultos && ninos <= capacidadNinos;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0">
        {children}

        {/* Calendario */}
        <section className="mt-10">
          <h2 className="text-[20px]">Disponibilidad y precio por noche</h2>
          <p className="mt-1 text-[12.5px] text-ink-3">
            Toca una noche de llegada y otra de salida. Las noches ocupadas no se pueden
            elegir.
          </p>
          <div className="mt-5 grid gap-8 sm:grid-cols-2">
            {meses.slice(0, 4).map((m) => (
              <div key={m.key}>
                <p className="mb-2 text-[13px] font-semibold capitalize text-carbon">
                  {MESES[m.month]} {m.year}
                </p>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {DOW.map((d, i) => (
                    <span key={i} className="text-[10px] font-medium text-ink-3">
                      {d}
                    </span>
                  ))}
                  {Array.from({ length: m.lead }).map((_, i) => (
                    <span key={`b${i}`} />
                  ))}
                  {m.days.map((c) => {
                    const sel = seleccion.has(c.fecha);
                    const esLlegada = c.fecha === llegada;
                    const esSalida = c.fecha === salida;
                    return (
                      <button
                        key={c.fecha}
                        type="button"
                        disabled={!c.disponible}
                        onClick={() => onPick(c.fecha, c.disponible)}
                        aria-pressed={sel}
                        className={clsx(
                          "flex aspect-square min-h-9 flex-col items-center justify-center rounded-[6px] text-[11px] leading-none transition-colors",
                          !c.disponible && "cursor-not-allowed text-ink-muted line-through",
                          c.disponible && !sel && "text-ink-2 hover:bg-marfil",
                          sel && !esLlegada && !esSalida && "bg-oro/25 text-carbon",
                          (esLlegada || esSalida) && "bg-carbon text-marfil",
                        )}
                      >
                        <span className="font-medium">{Number(c.fecha.slice(8, 10))}</span>
                        {c.precio != null && c.disponible && (
                          <span className="mt-0.5 text-[8.5px] opacity-70">
                            {Math.round(c.precio / 1000)}k
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {quote && quote.minStay > quote.noches && (
            <p className="mt-4 rounded-md bg-info-bg px-3 py-2 text-[12px] text-info-fg">
              Estas fechas piden una estadía mínima de {quote.minStay} noches.
            </p>
          )}
        </section>
      </div>

      {/* Tarjeta de reserva */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-lg border border-hairline bg-white p-5 shadow-elevated">
          <p className="text-[12px] text-ink-3">
            {quote ? nightsLabel(quote.noches) : "Elige tus fechas"}
          </p>
          <p className="font-heading text-[26px] leading-tight text-carbon">
            {quote ? formatCOP(quote.total) : formatCOP(calendar.find((c) => c.precio)?.precio ?? 0)}
            {!quote && <span className="text-[13px] font-normal text-ink-3"> / noche</span>}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <label className="text-[11px] font-medium text-ink-2">
              Llegada
              <input
                type="date"
                value={llegada}
                min={calendar[0]?.fecha}
                onChange={(e) => {
                  setLlegada(e.target.value);
                  if (salida && salida <= e.target.value) setSalida("");
                }}
                className="mt-1 h-10 w-full rounded-sm border border-hairline bg-white px-2 text-[12.5px]"
              />
            </label>
            <label className="text-[11px] font-medium text-ink-2">
              Salida
              <input
                type="date"
                value={salida}
                min={llegada || calendar[0]?.fecha}
                onChange={(e) => setSalida(e.target.value)}
                className="mt-1 h-10 w-full rounded-sm border border-hairline bg-white px-2 text-[12.5px]"
              />
            </label>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <SelectField
              name="adultos"
              label="Adultos"
              value={adultos}
              onChange={(e) => setAdultos(Number(e.target.value))}
              wrapClassName="[&_label]:text-[11px]"
              className="!h-10 !text-[12.5px]"
            >
              {Array.from({ length: capacidadAdultos }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </SelectField>
            <SelectField
              name="ninos"
              label="Niños"
              value={ninos}
              onChange={(e) => setNinos(Number(e.target.value))}
              wrapClassName="[&_label]:text-[11px]"
              className="!h-10 !text-[12.5px]"
            >
              {Array.from({ length: capacidadNinos + 1 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </SelectField>
          </div>

          {ratePlans.length > 1 && (
            <fieldset className="mt-3">
              <legend className="text-[11px] font-medium text-ink-2">Tarifa</legend>
              <div className="mt-1.5 space-y-1.5">
                {ratePlans.map((p) => (
                  <label
                    key={p.id}
                    className={clsx(
                      "flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-[12px]",
                      planId === p.id ? "border-oro bg-oro/[0.06]" : "border-hairline",
                    )}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={p.id}
                      checked={planId === p.id}
                      onChange={() => setPlanId(p.id)}
                      className="mt-0.5 accent-carbon"
                    />
                    <span>
                      <span className="font-medium text-carbon">{p.nombre}</span>
                      {p.descuentoPct > 0 && (
                        <span className="ml-1 text-oro-texto">−{p.descuentoPct}%</span>
                      )}
                      <span className="block text-[11px] leading-snug text-ink-3">
                        {p.reembolsable ? "Cancelación flexible" : "Sin cambios ni reembolsos"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {quote ? (
            <dl className="mt-4 space-y-1.5 border-t border-hairline pt-3 text-[12.5px]">
              <div className="flex justify-between text-ink-2">
                <dt>
                  {formatCOP(Math.round(quote.subtotal / quote.noches))} × {nightsLabel(quote.noches)}
                </dt>
                <dd>{formatCOP(quote.subtotal)}</dd>
              </div>
              {quote.descuento > 0 && (
                <div className="flex justify-between text-exito-fg">
                  <dt>Descuento tarifa</dt>
                  <dd>−{formatCOP(quote.descuento)}</dd>
                </div>
              )}
              <div className="flex justify-between text-ink-2">
                <dt>Impuestos y cargos</dt>
                <dd>Incluidos</dd>
              </div>
              <div className="flex justify-between border-t border-hairline pt-2 text-[14px] font-semibold text-carbon">
                <dt>Total {nightsLabel(quote.noches)}</dt>
                <dd>{formatCOP(quote.total)}</dd>
              </div>
              <p className="pt-1 text-[11.5px] text-ink-3">
                Pagas hoy un anticipo de {formatCOP(quote.anticipo)}
                {plan ? ` (${plan.reembolsable ? plan.anticipoPct : 100} %)` : ""}. El saldo,{" "}
                {formatCOP(quote.saldo)}, se paga al llegar.
              </p>
            </dl>
          ) : (
            <p className="mt-4 border-t border-hairline pt-3 text-[12px] text-ink-3">
              Elige llegada y salida para ver el total, el anticipo y el saldo.
            </p>
          )}

          <div className="mt-4">
            <Button
              href={
                quote && quote.todasDisponibles && capacidadOk && quote.noches >= quote.minStay
                  ? reservarHref({ slug, llegada, salida, adultos, ninos, plan: planId })
                  : "#"
              }
              variant="primary"
              size="lg"
              fullWidth
              className={clsx(
                !(quote && quote.todasDisponibles && capacidadOk && quote.noches >= quote.minStay) &&
                  "pointer-events-none opacity-55",
              )}
            >
              Reservar {nombre}
            </Button>
            {!capacidadOk && (
              <p className="mt-2 text-[11.5px] text-error-fg">
                {nombre} admite hasta {capacidadAdultos} adultos
                {capacidadNinos ? ` y ${capacidadNinos} niños` : ""}.
              </p>
            )}
            {quote && !quote.todasDisponibles && (
              <p className="mt-2 text-[11.5px] text-error-fg">
                Alguna noche de ese rango ya está ocupada. Elige otras fechas.
              </p>
            )}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
            {plan?.politicaCancelacion ??
              "Cancelación gratuita hasta 5 días antes con la tarifa flexible."}
          </p>
        </div>
      </aside>
    </div>
  );
}

function groupByMonth(calendar: CalNight[]) {
  const map = new Map<string, { key: string; year: number; month: number; lead: number; days: CalNight[] }>();
  for (const c of calendar) {
    const [y, m] = c.fecha.split("-").map(Number);
    const key = `${y}-${m}`;
    if (!map.has(key)) {
      const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // 0 dom
      const lead = (first + 6) % 7; // lunes-primero
      map.set(key, { key, year: y, month: m - 1, lead, days: [] });
    }
    map.get(key)!.days.push(c);
  }
  return [...map.values()];
}
