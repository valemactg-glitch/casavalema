import type { Metadata } from "next";
import { PageIntro, Section } from "@/components/site/Section";
import { Callout } from "@/components/ui/Callout";
import { SearchForm } from "@/components/booking/SearchForm";
import { ResultsBrowser, type ResultDTO } from "@/components/booking/ResultsBrowser";
import { searchAvailability } from "@/lib/booking/search";
import { parseSearch, ISSUE_TEXT } from "@/lib/search-params";
import { toISODate, formatRangeEs } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Habitaciones y disponibilidad",
  description: "Compara las cinco habitaciones de Casa Turística Valema con precio y disponibilidad reales para tus fechas.",
  alternates: { canonical: "/habitaciones" },
};

export default async function HabitacionesPage(props: PageProps<"/habitaciones">) {
  const raw = await props.searchParams;
  const { search, issues } = parseSearch(raw);
  const result = await searchAvailability({
    llegada: search.llegada,
    salida: search.salida,
    adultos: search.adultos,
    ninos: search.ninos,
    habitaciones: search.habitaciones,
    codigoPromocional: search.codigo,
  });

  const dto: ResultDTO[] = result.rooms.map((x): ResultDTO => {
    const base = {
      slug: x.room.slug,
      nombre: x.room.nombre,
      descripcionCorta: x.room.descripcionCorta,
      capacidadAdultos: x.room.capacidadAdultos,
      capacidadNinos: x.room.capacidadNinos,
      cama: x.room.cama,
      tamanoM2: x.room.tamanoM2,
      vista: x.room.vista,
      banoPrivado: x.room.banoPrivado,
      servicios: x.room.servicios,
      cover: x.room.cover,
      precioDesde: x.room.precioBase,
      hayNoReembolsable: x.room.ratePlans.some((p) => !p.reembolsable),
    };
    if ("quote" in x) {
      return {
        ...base,
        estado: x.estado,
        flexPlanId: x.flexPlanId,
        quote: {
          noches: x.quote.noches,
          subtotal: x.quote.subtotal,
          descuento: x.quote.descuento,
          total: x.quote.total,
          anticipo: x.quote.anticipo,
          saldo: x.quote.saldo,
          reembolsable: x.quote.reembolsable,
        },
      };
    }
    if ("minNights" in x) {
      return { ...base, estado: "estadia_minima", minNights: x.minNights };
    }
    return {
      ...base,
      estado: x.estado === "capacidad" ? "capacidad" : "no_disponible",
      motivo: x.motivo,
      alternativas: x.alternativas.map((a) => ({
        llegada: toISODate(a.llegada),
        salida: toISODate(a.salida),
        label: formatRangeEs(a.llegada, a.salida),
      })),
    };
  });

  const defaults = {
    llegada: toISODate(search.llegada),
    salida: toISODate(search.salida),
    adultos: search.adultos,
    ninos: search.ninos,
    habitaciones: search.habitaciones,
    codigo: search.codigo,
  };

  return (
    <>
      <PageIntro
        kicker="Habitaciones"
        title="Elige dónde dormir"
        intro="Precios y disponibilidad reales para las fechas que elijas. Puedes reservar más de una habitación en la misma compra."
      />

      <Section>
        <SearchForm defaults={defaults} variant="bar" action="/habitaciones" />

        {issues.length > 0 && (
          <div className="mt-4 space-y-2">
            {issues.map((i) => (
              <Callout key={i} tone="aviso" role="status">
                {ISSUE_TEXT[i]}
              </Callout>
            ))}
          </div>
        )}

        {result.disponibles === 0 ? (
          <div className="mt-6">
            <Callout tone="info" title={`Sin disponibilidad para ${formatRangeEs(search.llegada, search.salida)}`}>
              Ninguna habitación está libre para esas fechas y ese número de huéspedes.
              Abajo te proponemos fechas cercanas que sí funcionan, o escríbenos por
              WhatsApp y revisamos contigo.
            </Callout>
            <div className="mt-6">
              <ResultsBrowser results={dto} search={{ ...defaults, noches: result.noches }} disponibles={result.disponibles} />
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <ResultsBrowser
              results={dto}
              search={{ ...defaults, noches: result.noches }}
              disponibles={result.disponibles}
            />
          </div>
        )}
      </Section>
    </>
  );
}
