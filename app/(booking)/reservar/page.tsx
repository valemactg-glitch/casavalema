import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/booking/SearchForm";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { Callout } from "@/components/ui/Callout";
import { getRoom, getServices } from "@/lib/queries";
import { parseSearch, defaultArrival } from "@/lib/search-params";
import { toISODate, addDays, formatRangeEs, parseISODate, nights, today } from "@/lib/dates";
import { checkRoomAvailability } from "@/lib/booking/availability";
import { getSessionId } from "@/lib/session";
import { quote as computeQuote } from "@/lib/booking/pricing";
import type { ClientQuote } from "@/lib/booking/clientQuote";

// Datos en vivo (disponibilidad, precios, contenido editable): nunca prerenderizar.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reservar",
  robots: { index: false, follow: false },
};

export default async function ReservarPage(props: PageProps<"/reservar">) {
  const raw = await props.searchParams;
  const habitacionSlug = typeof raw.habitacion === "string" ? raw.habitacion : null;

  if (!habitacionSlug) {
    const llegada = defaultArrival();
    return (
      <div className="mx-auto max-w-2xl">
        <p className="kicker">Reservar</p>
        <h1 className="mt-1 text-[clamp(1.7rem,4vw,2.2rem)]">Primero, elige fechas y habitación</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
          Comprueba disponibilidad para tus fechas y elige la habitación. Desde ahí
          continúas con servicios, datos y pago.
        </p>
        <div className="mt-6">
          <SearchForm
            defaults={{
              llegada: toISODate(llegada),
              salida: toISODate(addDays(llegada, 2)),
              adultos: 2,
              ninos: 0,
              habitaciones: 1,
            }}
            variant="page"
            action="/habitaciones"
          />
        </div>
        <p className="mt-4 text-[13px] text-ink-3">
          ¿Ya sabes cuál quieres?{" "}
          <Link href="/habitaciones" className="underline">
            Ver las cinco habitaciones
          </Link>
          .
        </p>
      </div>
    );
  }

  const { search } = parseSearch(raw);
  const room = await getRoom(habitacionSlug);

  if (!room) {
    return (
      <div className="mx-auto max-w-xl">
        <Callout tone="error" title="Habitación no encontrada">
          Esa habitación no existe o ya no está disponible.{" "}
          <Link href="/habitaciones">Ver habitaciones</Link>.
        </Callout>
      </div>
    );
  }

  const llegadaDef = parseISODate(typeof raw.llegada === "string" ? raw.llegada : undefined) ?? search.llegada;
  const salidaDef = parseISODate(typeof raw.salida === "string" ? raw.salida : undefined) ?? search.salida;
  const adultos = Math.min(search.adultos, room.capacidadAdultos);
  const ninos = Math.min(search.ninos, room.capacidadNinos);

  // Chequeo previo (la verdad se revalida al crear retención y reserva).
  const check = await checkRoomAvailability({
    roomId: room.id,
    llegada: llegadaDef,
    salida: salidaDef,
    adultos,
    ninos,
    today: today(),
    ignoreSessionId: await getSessionId(), // el huésped está reservando: no chocar con su propia retención
  });

  const servicios = await getServices();
  const noches = nights(llegadaDef, salidaDef);

  // Cotización autoritativa por tarifa (el total no cambia hasta el pago).
  const quotes: Record<string, ClientQuote> = {};
  if (check.ok) {
    for (const p of room.ratePlans) {
      const q = computeQuote({ availability: check.availability, ratePlan: p });
      quotes[p.id] = {
        noches: q.noches,
        nightly: q.nightly,
        subtotal: q.subtotal,
        descuento: q.descuento,
        total: q.total,
        anticipo: q.anticipo,
        saldo: q.saldo,
        minStay: noches,
        todasDisponibles: true,
      };
    }
  }

  const planId =
    (typeof raw.plan === "string" && room.ratePlans.find((p) => p.id === raw.plan)?.id) ||
    room.ratePlans.find((p) => p.reembolsable)?.id ||
    room.ratePlans[0]?.id ||
    "";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="kicker">Reservar · {room.nombre}</p>
          <h1 className="mt-1 text-[clamp(1.5rem,3.5vw,2rem)]">
            {formatRangeEs(llegadaDef, salidaDef)}
          </h1>
        </div>
        <Link
          href={`/habitaciones/${room.slug}?llegada=${toISODate(llegadaDef)}&salida=${toISODate(salidaDef)}`}
          className="text-[12.5px] text-ink-2 underline hover:text-carbon"
        >
          Cambiar habitación o fechas
        </Link>
      </div>

      {!check.ok && (
        <Callout tone="aviso" className="mb-6" title="Revisa las fechas">
          {check.message}{" "}
          <Link href={`/habitaciones/${room.slug}`}>Elige otras fechas</Link>.
        </Callout>
      )}

      <BookingWizard
        habitacion={{
          slug: room.slug,
          nombre: room.nombre,
          capacidadAdultos: room.capacidadAdultos,
          capacidadNinos: room.capacidadNinos,
        }}
        quotes={quotes}
        disponible={check.ok}
        motivoNoDisponible={check.ok ? undefined : check.message}
        ratePlans={room.ratePlans.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          reembolsable: p.reembolsable,
          anticipoPct: p.anticipoPct,
          descuentoPct: p.descuentoPct,
          politicaCancelacion: p.politicaCancelacion,
        }))}
        servicios={servicios.map((s) => ({
          id: s.id,
          nombre: s.nombre,
          descripcion: s.descripcion,
          precio: s.precio,
          tipoCobro: s.tipoCobro,
          disponibilidad: s.disponibilidad,
        }))}
        defaults={{
          llegada: toISODate(llegadaDef),
          salida: toISODate(salidaDef),
          adultos,
          ninos,
          planId,
        }}
      />
    </div>
  );
}
