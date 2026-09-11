"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCOP } from "@/lib/format";
import { guestsLabel, nightsLabel } from "@/lib/dates";
import { amenidadLabel } from "@/lib/catalog";
import { reservarHref } from "@/lib/booking/links";

export type ResultDTO = {
  slug: string;
  nombre: string;
  descripcionCorta: string;
  capacidadAdultos: number;
  capacidadNinos: number;
  cama: string;
  tamanoM2: number | null;
  vista: string | null;
  banoPrivado: boolean;
  servicios: string[];
  cover: { url: string; alt: string } | null;
  precioDesde: number;
  estado: "disponible" | "ultima" | "estadia_minima" | "no_disponible" | "capacidad";
  quote?: {
    noches: number;
    subtotal: number;
    descuento: number;
    total: number;
    anticipo: number;
    saldo: number;
    reembolsable: boolean;
  };
  flexPlanId?: string;
  minNights?: number;
  motivo?: string;
  alternativas?: { llegada: string; salida: string; label: string }[];
  hayNoReembolsable?: boolean;
};

type Search = {
  llegada: string;
  salida: string;
  adultos: number;
  ninos: number;
  noches: number;
};

const FILTROS = [
  { key: "todas", label: "Todas" },
  { key: "2h", label: "2 huéspedes" },
  { key: "3h", label: "3 o más" },
  { key: "bano", label: "Baño privado" },
  { key: "economica", label: "Hasta $250.000" },
];

export function ResultsBrowser({
  results,
  search,
  disponibles,
}: {
  results: ResultDTO[];
  search: Search;
  disponibles: number;
}) {
  const [filtro, setFiltro] = useState("todas");

  const visibles = useMemo(() => {
    return results.filter((r) => {
      switch (filtro) {
        case "2h":
          return r.capacidadAdultos + r.capacidadNinos <= 2;
        case "3h":
          return r.capacidadAdultos + r.capacidadNinos >= 3;
        case "bano":
          return r.banoPrivado;
        case "economica":
          return r.precioDesde <= 250000;
        default:
          return true;
      }
    });
  }, [results, filtro]);

  const noDisponibles = results.filter(
    (r) => r.estado === "no_disponible" || r.estado === "capacidad",
  );
  const altGlobal = noDisponibles.flatMap((r) => r.alternativas ?? []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros">
          <span className="self-center text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
            Filtros
          </span>
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              aria-pressed={filtro === f.key}
              className={clsx(
                "rounded-pill px-3 py-1.5 text-[12px] font-medium transition-colors",
                filtro === f.key
                  ? "bg-carbon text-marfil"
                  : "border border-hairline bg-white text-ink-2 hover:border-carbon",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-[12.5px] text-ink-3">
          {disponibles} de {results.length} disponibles para {nightsLabel(search.noches)}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {visibles.map((r) => (
          <ResultCard key={r.slug} r={r} search={search} />
        ))}
        {visibles.length === 0 && (
          <p className="rounded-lg border border-hairline bg-white p-6 text-[13px] text-ink-3">
            Ninguna habitación cumple ese filtro para estas fechas. Prueba con otro filtro.
          </p>
        )}
      </div>

      {altGlobal.length > 0 && (
        <div className="mt-8 rounded-lg bg-info-bg p-5 text-info-fg">
          <p className="text-[13px] font-semibold">¿Flexible con las fechas?</p>
          <p className="mt-1 text-[12.5px]">
            Algunas habitaciones no están libres para {nightsLabel(search.noches)} en esas
            fechas, pero sí para estas:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {dedupe(altGlobal).map((a) => (
              <Link
                key={a.label}
                href={`/habitaciones?${new URLSearchParams({
                  llegada: a.llegada,
                  salida: a.salida,
                  adultos: String(search.adultos),
                  ninos: String(search.ninos),
                  habitaciones: "1",
                }).toString()}`}
                className="rounded-pill bg-white px-3 py-1.5 text-[12px] font-medium text-info-fg hover:bg-white/80"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function dedupe(alts: { llegada: string; salida: string; label: string }[]) {
  const seen = new Set<string>();
  return alts.filter((a) => {
    const k = `${a.llegada}-${a.salida}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function ResultCard({ r, search }: { r: ResultDTO; search: Search }) {
  const disponible = r.estado === "disponible" || r.estado === "ultima";
  const chips = r.servicios.slice(0, 4).map(amenidadLabel);

  return (
    <article
      className={clsx(
        "grid gap-4 rounded-lg border border-hairline bg-white p-4 sm:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr_220px]",
        !disponible && r.estado !== "estadia_minima" && "opacity-70",
      )}
    >
      <Link href={`/habitaciones/${r.slug}`} className="relative block overflow-hidden rounded-md">
        <ImageSlot src={r.cover?.url} alt={r.cover?.alt ?? r.nombre} ratio="4/3" />
        <span className="absolute left-2 top-2">
          {r.estado === "disponible" && <Badge tone="exito">Disponible</Badge>}
          {r.estado === "ultima" && <Badge tone="error-soft">Última habitación</Badge>}
          {r.estado === "estadia_minima" && <Badge tone="info">Estadía mínima</Badge>}
          {(r.estado === "no_disponible" || r.estado === "capacidad") && (
            <Badge tone="neutro">No disponible</Badge>
          )}
        </span>
      </Link>

      <div className="min-w-0 space-y-2">
        <h3 className="text-[19px]">
          <Link href={`/habitaciones/${r.slug}`} className="text-carbon hover:text-oro-texto">
            {r.nombre}
          </Link>
        </h3>
        <p className="text-[12px] text-ink-3">
          {guestsLabel(r.capacidadAdultos, r.capacidadNinos)} · {r.cama}
          {r.tamanoM2 ? ` · ${r.tamanoM2} m²` : ""}
          {r.banoPrivado ? " · baño privado" : ""}
          {r.vista ? ` · ${r.vista.toLowerCase()}` : ""}
        </p>
        <p className="text-[13px] leading-relaxed text-ink-2">{r.descripcionCorta}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {chips.map((c) => (
            <span key={c} className="rounded-pill bg-marfil px-2.5 py-1 text-[11px] text-ink-2">
              {c}
            </span>
          ))}
        </div>

        {r.estado === "estadia_minima" && (
          <p className="mt-2 rounded-md bg-info-bg px-3 py-2 text-[12px] text-info-fg">
            Estas fechas piden una estadía mínima de {r.minNights} noches. Amplía tu
            búsqueda para ver el precio.
          </p>
        )}
        {(r.estado === "no_disponible" || r.estado === "capacidad") && (
          <p className="mt-2 text-[12px] text-ink-3">
            {r.motivo} Te avisamos si se libera:{" "}
            <Link href="/contacto" className="underline">
              déjanos tu correo
            </Link>
            .
          </p>
        )}
      </div>

      <div className="flex flex-col justify-between gap-3 border-t border-hairline pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        {disponible && r.quote ? (
          <>
            <div>
              <p className="text-[11px] text-ink-3">
                {nightsLabel(r.quote.noches)}, {guestsLabel(search.adultos, search.ninos)}
              </p>
              <p className="font-heading text-[24px] leading-tight text-carbon">
                {formatCOP(r.quote.total)}
              </p>
              <p className="text-[11px] text-ink-3">
                {formatCOP(Math.round(r.quote.subtotal / r.quote.noches))} / noche · impuestos
                incluidos
              </p>
              <p className="mt-1 text-[11px] text-ink-3">
                Anticipo hoy {formatCOP(r.quote.anticipo)} · saldo {formatCOP(r.quote.saldo)}
              </p>
            </div>
            <div className="space-y-2">
              <Button
                href={reservarHref({
                  slug: r.slug,
                  llegada: search.llegada,
                  salida: search.salida,
                  adultos: search.adultos,
                  ninos: search.ninos,
                  plan: r.flexPlanId,
                })}
                variant={r.estado === "ultima" ? "gold" : "primary"}
                size="sm"
                fullWidth
              >
                Reservar
              </Button>
              <Link
                href={`/habitaciones/${r.slug}`}
                className="block text-center text-[12px] font-semibold text-oro-texto hover:underline"
              >
                Ver habitación
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-[12px] text-ink-3">
              Desde <span className="font-semibold text-carbon">{formatCOP(r.precioDesde)}</span> /
              noche en otras fechas
            </p>
            <div className="space-y-2">
              {r.alternativas && r.alternativas.length > 0 && (
                <Button
                  href={`/habitaciones?${new URLSearchParams({
                    llegada: r.alternativas[0].llegada,
                    salida: r.alternativas[0].salida,
                    adultos: String(search.adultos),
                    ninos: String(search.ninos),
                    habitaciones: "1",
                  }).toString()}`}
                  variant="outline"
                  size="sm"
                  fullWidth
                >
                  Ver fechas alternativas
                </Button>
              )}
              <Link
                href={`/habitaciones/${r.slug}`}
                className="block text-center text-[12px] font-semibold text-oro-texto hover:underline"
              >
                Ver habitación
              </Link>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
