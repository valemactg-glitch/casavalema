import "server-only";
import { db } from "@/lib/db";
import { addDays, nights, today } from "@/lib/dates";
import {
  alternativeDates,
  checkRoomAvailability,
  type RoomAvailabilityCheck,
} from "@/lib/booking/availability";
import { quote, type Quote } from "@/lib/booking/pricing";

export type SearchParams = {
  llegada: Date;
  salida: Date;
  adultos: number;
  ninos: number;
  habitaciones: number;
  codigoPromocional?: string | null;
};

export type RoomCard = {
  id: string;
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
  precioBase: number;
  cover: { url: string; alt: string } | null;
  ratePlans: {
    id: string;
    nombre: string;
    reembolsable: boolean;
    anticipoPct: number;
    descuentoPct: number;
    politicaCancelacion: string;
  }[];
};

export type SearchResultRoom =
  | {
      room: RoomCard;
      estado: "disponible" | "ultima";
      quote: Quote;
      flexPlanId: string;
    }
  | {
      room: RoomCard;
      estado: "estadia_minima";
      minNights: number;
    }
  | {
      room: RoomCard;
      estado: "no_disponible" | "capacidad";
      motivo: string;
      alternativas: { llegada: Date; salida: Date }[];
    };

export type SearchResult = {
  params: SearchParams;
  noches: number;
  disponibles: number;
  total: number;
  rooms: SearchResultRoom[];
};

function toCard(r: Awaited<ReturnType<typeof loadRooms>>[number]): RoomCard {
  const cover = r.images.find((i) => i.portada) ?? r.images[0] ?? null;
  return {
    id: r.id,
    slug: r.slug,
    nombre: r.nombre,
    descripcionCorta: r.descripcionCorta,
    capacidadAdultos: r.capacidadAdultos,
    capacidadNinos: r.capacidadNinos,
    cama: r.cama,
    tamanoM2: r.tamanoM2,
    vista: r.vista,
    banoPrivado: r.banoPrivado,
    servicios: r.servicios,
    precioBase: r.precioBase,
    cover: cover ? { url: cover.url, alt: cover.alt } : null,
    ratePlans: r.ratePlans.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      reembolsable: p.reembolsable,
      anticipoPct: p.anticipoPct,
      descuentoPct: p.descuentoPct,
      politicaCancelacion: p.politicaCancelacion,
    })),
  };
}

function loadRooms() {
  return db.room.findMany({
    where: { visible: true },
    orderBy: { orden: "asc" },
    include: {
      images: { orderBy: { orden: "asc" } },
      ratePlans: { where: { activo: true }, orderBy: { descuentoPct: "asc" } },
    },
  });
}

export async function searchAvailability(params: SearchParams): Promise<SearchResult> {
  const t = today();
  const rooms = await loadRooms();
  const noches = nights(params.llegada, params.salida);

  const results: SearchResultRoom[] = [];
  for (const r of rooms) {
    const card = toCard(r);
    const check: RoomAvailabilityCheck = await checkRoomAvailability({
      roomId: r.id,
      llegada: params.llegada,
      salida: params.salida,
      adultos: params.adultos,
      ninos: params.ninos,
      today: t,
    });

    if (check.ok) {
      const flex = r.ratePlans.find((p) => p.reembolsable) ?? r.ratePlans[0];
      results.push({
        room: card,
        estado: "disponible",
        flexPlanId: flex.id,
        quote: quote({ availability: check.availability, ratePlan: flex }),
      });
      continue;
    }

    if (check.reason === "estadia_minima") {
      results.push({ room: card, estado: "estadia_minima", minNights: check.minNights ?? noches + 1 });
      continue;
    }
    if (check.reason === "capacidad") {
      results.push({ room: card, estado: "capacidad", motivo: check.message, alternativas: [] });
      continue;
    }

    const alternativas = await alternativeDates({
      roomId: r.id,
      llegada: params.llegada,
      salida: params.salida,
      adultos: params.adultos,
      ninos: params.ninos,
      today: t,
    });
    results.push({ room: card, estado: "no_disponible", motivo: check.message, alternativas });
  }

  const disponibles = results.filter((x) => x.estado === "disponible").length;

  // Si sólo queda una, márcala como "última habitación".
  if (disponibles === 1) {
    for (const x of results) {
      if (x.estado === "disponible") x.estado = "ultima";
    }
  }

  return {
    params,
    noches,
    disponibles,
    total: rooms.length,
    rooms: results,
  };
}

/** Precio "desde" para las tarjetas sin fechas: mínimo de los próximos 90 días. */
export async function precioDesde(roomId: string): Promise<number> {
  const t = today();
  const row = await db.availability.findFirst({
    where: { roomId, cerrado: false, fecha: { gte: t, lt: addDays(t, 90) } },
    orderBy: { precio: "asc" },
    select: { precio: true },
  });
  return row?.precio ?? 0;
}
