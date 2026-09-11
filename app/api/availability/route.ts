import type { NextRequest } from "next/server";
import { json } from "@/lib/http";
import { parseSearch } from "@/lib/search-params";
import { searchAvailability } from "@/lib/booking/search";
import { toISODate, formatRangeEs } from "@/lib/dates";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const { search, issues } = parseSearch({
    llegada: sp.get("in") ?? sp.get("llegada") ?? undefined,
    salida: sp.get("out") ?? sp.get("salida") ?? undefined,
    adultos: sp.get("adults") ?? sp.get("adultos") ?? undefined,
    ninos: sp.get("children") ?? sp.get("ninos") ?? undefined,
    habitaciones: sp.get("rooms") ?? sp.get("habitaciones") ?? undefined,
    codigo: sp.get("codigo") ?? undefined,
  });

  const result = await searchAvailability({
    llegada: search.llegada,
    salida: search.salida,
    adultos: search.adultos,
    ninos: search.ninos,
    habitaciones: search.habitaciones,
    codigoPromocional: search.codigo,
  });

  return json({
    ok: true,
    issues,
    busqueda: {
      llegada: toISODate(search.llegada),
      salida: toISODate(search.salida),
      noches: result.noches,
      adultos: search.adultos,
      ninos: search.ninos,
    },
    disponibles: result.disponibles,
    total: result.total,
    habitaciones: result.rooms.map((x) => ({
      slug: x.room.slug,
      nombre: x.room.nombre,
      estado: x.estado,
      capacidad: x.room.capacidadAdultos + x.room.capacidadNinos,
      precioBase: x.room.precioBase,
      ...("quote" in x
        ? {
            total: x.quote.total,
            subtotal: x.quote.subtotal,
            descuento: x.quote.descuento,
            impuestos: x.quote.impuestos,
            anticipo: x.quote.anticipo,
            saldo: x.quote.saldo,
            reembolsable: x.quote.reembolsable,
            planId: x.flexPlanId,
          }
        : {}),
      ...("minNights" in x ? { estadiaMinima: x.minNights } : {}),
      ...("alternativas" in x
        ? {
            motivo: x.motivo,
            alternativas: x.alternativas.map((a) => ({
              llegada: toISODate(a.llegada),
              salida: toISODate(a.salida),
              label: formatRangeEs(a.llegada, a.salida),
            })),
          }
        : {}),
    })),
  });
}
