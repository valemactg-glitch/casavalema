import "server-only";
import { db } from "@/lib/db";
import { addDays, eachNight, nights, toISODate } from "@/lib/dates";
import type { Availability, BookingEstado } from "@prisma/client";

/**
 * Estados que ocupan inventario de forma firme. PENDIENTE_PAGO ocupa
 * sólo mientras su retención (`holdExpiraEn`) siga viva — se maneja aparte.
 */
export const OCCUPYING_STATES: BookingEstado[] = [
  "PAGO_PARCIAL",
  "CONFIRMADA",
  "EN_CURSO",
  "COMPLETADA",
];

export type NightBlockReason = "reserva" | "bloqueo" | "retencion" | "cerrado";

/**
 * Conjunto de noches NO disponibles para una habitación en [from, to).
 * Une reservas activas + bloqueos + retenciones vivas + inventario cerrado.
 * `ignoreHoldId` permite que una sesión no choque con su propia retención.
 */
export async function takenNights(
  roomId: string,
  from: Date,
  to: Date,
  opts?: { ignoreHoldId?: string; ignoreSessionId?: string; now?: Date },
): Promise<Map<string, NightBlockReason>> {
  const now = opts?.now ?? new Date();
  const taken = new Map<string, NightBlockReason>();

  const [bookings, blocks, holds, closed] = await Promise.all([
    db.booking.findMany({
      where: {
        roomId,
        llegada: { lt: to },
        salida: { gt: from },
        OR: [
          { estado: { in: OCCUPYING_STATES } },
          {
            estado: "PENDIENTE_PAGO",
            OR: [{ holdExpiraEn: null }, { holdExpiraEn: { gt: now } }],
          },
        ],
      },
      select: { llegada: true, salida: true },
    }),
    db.block.findMany({
      where: { roomId, desde: { lt: to }, hasta: { gt: from } },
      select: { desde: true, hasta: true },
    }),
    db.bookingHold.findMany({
      where: {
        roomId,
        expiraEn: { gt: now },
        llegada: { lt: to },
        salida: { gt: from },
        ...(opts?.ignoreHoldId ? { NOT: { id: opts.ignoreHoldId } } : {}),
        ...(opts?.ignoreSessionId ? { NOT: { sessionId: opts.ignoreSessionId } } : {}),
      },
      select: { llegada: true, salida: true },
    }),
    db.availability.findMany({
      where: { roomId, cerrado: true, fecha: { gte: from, lt: to } },
      select: { fecha: true },
    }),
  ]);

  for (const b of bookings) {
    for (const n of eachNight(b.llegada, b.salida)) taken.set(toISODate(n), "reserva");
  }
  for (const b of blocks) {
    for (const n of eachNight(b.desde, b.hasta)) taken.set(toISODate(n), "bloqueo");
  }
  for (const h of holds) {
    for (const n of eachNight(h.llegada, h.salida)) {
      if (!taken.has(toISODate(n))) taken.set(toISODate(n), "retencion");
    }
  }
  for (const c of closed) taken.set(toISODate(c.fecha), "cerrado");

  return taken;
}

export type RoomAvailabilityCheck =
  | { ok: true; availability: Availability[] }
  | {
      ok: false;
      reason:
        | "fechas_invalidas"
        | "no_disponible"
        | "sin_tarifas"
        | "estadia_minima"
        | "estadia_maxima"
        | "anticipacion"
        | "capacidad";
      message: string;
      minNights?: number;
      maxNights?: number;
    };

/**
 * Verifica que una habitación pueda reservarse en un rango concreto.
 * Se usa en la búsqueda, al crear la retención y al crear la reserva.
 */
export async function checkRoomAvailability(params: {
  roomId: string;
  llegada: Date;
  salida: Date;
  adultos: number;
  ninos: number;
  today: Date;
  ignoreHoldId?: string;
  ignoreSessionId?: string;
}): Promise<RoomAvailabilityCheck> {
  const { roomId, llegada, salida, adultos, ninos, today } = params;
  const n = nights(llegada, salida);

  if (n < 1 || salida <= llegada) {
    return { ok: false, reason: "fechas_invalidas", message: "La salida debe ser posterior a la llegada." };
  }
  if (llegada < today) {
    return { ok: false, reason: "fechas_invalidas", message: "La llegada no puede ser una fecha pasada." };
  }

  const room = await db.room.findUnique({
    where: { id: roomId },
    select: {
      capacidadAdultos: true,
      capacidadNinos: true,
      estadiaMin: true,
      estadiaMax: true,
      ventaCerrada: true,
      visible: true,
      _count: { select: { ratePlans: { where: { activo: true } } } },
    },
  });
  if (!room || !room.visible || room.ventaCerrada) {
    return { ok: false, reason: "no_disponible", message: "Esta habitación no está disponible para reservar." };
  }
  if (room._count.ratePlans === 0) {
    return { ok: false, reason: "sin_tarifas", message: "Esta habitación no tiene tarifas activas." };
  }
  if (adultos > room.capacidadAdultos || ninos > room.capacidadNinos || adultos < 1) {
    return {
      ok: false,
      reason: "capacidad",
      message: `Esta habitación admite hasta ${room.capacidadAdultos} adultos${
        room.capacidadNinos ? ` y ${room.capacidadNinos} niños` : ""
      }.`,
    };
  }

  // Filas de disponibilidad para cada noche del rango.
  const rows = await db.availability.findMany({
    where: { roomId, fecha: { gte: llegada, lt: salida } },
    orderBy: { fecha: "asc" },
  });
  if (rows.length !== n) {
    return { ok: false, reason: "no_disponible", message: "No tenemos tarifa publicada para todas esas noches." };
  }

  // Estadía mínima / máxima: la más exigente de las noches + la de la habitación.
  const minStay = Math.max(room.estadiaMin, ...rows.map((r) => r.estadiaMin));
  if (n < minStay) {
    return {
      ok: false,
      reason: "estadia_minima",
      message: `Estas fechas requieren una estadía mínima de ${minStay} noches.`,
      minNights: minStay,
    };
  }
  const maxStays = rows.map((r) => r.estadiaMax).filter((x): x is number => x != null);
  const roomMax = room.estadiaMax ?? undefined;
  const maxStay = Math.min(...(roomMax ? [roomMax, ...maxStays] : maxStays.length ? maxStays : [Infinity]));
  if (Number.isFinite(maxStay) && n > maxStay) {
    return {
      ok: false,
      reason: "estadia_maxima",
      message: `La estadía máxima para estas fechas es de ${maxStay} noches.`,
      maxNights: maxStay,
    };
  }

  // Anticipación mínima (días desde hoy hasta la llegada).
  const anticMin = Math.max(0, ...rows.map((r) => r.anticipacionMin));
  const diasHastaLlegada = Math.round((llegada.getTime() - today.getTime()) / 86_400_000);
  if (diasHastaLlegada < anticMin) {
    return {
      ok: false,
      reason: "anticipacion",
      message: `Estas fechas requieren reservar con al menos ${anticMin} días de anticipación.`,
    };
  }

  // Noches ocupadas.
  const taken = await takenNights(roomId, llegada, salida, {
    ignoreHoldId: params.ignoreHoldId,
    ignoreSessionId: params.ignoreSessionId,
  });
  if (taken.size > 0) {
    return { ok: false, reason: "no_disponible", message: "Alguna de esas noches ya está reservada." };
  }

  return { ok: true, availability: rows };
}

/**
 * Busca fechas alternativas cercanas con la misma cantidad de noches:
 * mueve el rango ±1..±14 días y devuelve las primeras que sí funcionan.
 */
export async function alternativeDates(params: {
  roomId: string;
  llegada: Date;
  salida: Date;
  adultos: number;
  ninos: number;
  today: Date;
  limit?: number;
}): Promise<{ llegada: Date; salida: Date }[]> {
  const { roomId, llegada, salida, adultos, ninos, today } = params;
  const limit = params.limit ?? 2;
  const found: { llegada: Date; salida: Date }[] = [];
  const offsets = [1, -1, 2, -2, 3, -3, 4, 5, 6, 7, 10, 14];
  for (const off of offsets) {
    const l = addDays(llegada, off);
    const s = addDays(salida, off);
    if (l < today) continue;
    const check = await checkRoomAvailability({ roomId, llegada: l, salida: s, adultos, ninos, today });
    if (check.ok) {
      found.push({ llegada: l, salida: s });
      if (found.length >= limit) break;
    }
  }
  return found;
}
