import "server-only";
import { db } from "@/lib/db";
import { today } from "@/lib/dates";
import { checkRoomAvailability } from "@/lib/booking/availability";
import { withRoomLock } from "@/lib/booking/lock";

export const HOLD_TTL_MIN = Math.max(3, Number(process.env.HOLD_TTL_MINUTES ?? 15));

/** Borra retenciones vencidas que no derivaron en reserva. */
export async function releaseExpiredHolds(): Promise<number> {
  const { count } = await db.bookingHold.deleteMany({
    where: { expiraEn: { lt: new Date() }, bookingId: null },
  });
  return count;
}

/**
 * Libera reservas PENDIENTE_PAGO cuya retención venció sin ningún pago
 * aprobado. Una reserva pendiente nunca bloquea inventario indefinidamente.
 */
export async function releaseStaleBookings(): Promise<number> {
  const stale = await db.booking.findMany({
    where: {
      estado: "PENDIENTE_PAGO",
      holdExpiraEn: { lt: new Date() },
      payments: { none: { estado: { in: ["APROBADO", "PENDIENTE"] } } },
    },
    select: { id: true },
  });
  if (stale.length === 0) return 0;
  await db.$transaction([
    db.booking.updateMany({
      where: { id: { in: stale.map((s) => s.id) } },
      data: { estado: "CANCELADA" },
    }),
    db.bookingEvent.createMany({
      data: stale.map((s) => ({
        bookingId: s.id,
        tipo: "estado",
        detalle: "Cancelada automáticamente: la retención venció sin pago",
        valorNuevo: "CANCELADA",
        actor: "sistema",
      })),
    }),
    db.bookingHold.deleteMany({ where: { bookingId: { in: stale.map((s) => s.id) } } }),
  ]);
  return stale.length;
}

export type CreateHoldInput = {
  roomId: string;
  llegada: Date;
  salida: Date;
  adultos: number;
  ninos: number;
  sessionId: string;
};

export type CreateHoldResult =
  | { ok: true; holdId: string; expiraEn: Date }
  | { ok: false; message: string; reason: string };

/**
 * Crea (o renueva) la retención temporal de una habitación para una sesión.
 * Revalida disponibilidad bajo lock antes de apartar el inventario.
 */
export async function createOrRenewHold(input: CreateHoldInput): Promise<CreateHoldResult> {
  await releaseExpiredHolds();
  const t = today();

  try {
    return await withRoomLock(input.roomId, async (tx) => {
      const existing = await tx.bookingHold.findFirst({
        where: {
          roomId: input.roomId,
          sessionId: input.sessionId,
          llegada: input.llegada,
          salida: input.salida,
          bookingId: null,
        },
      });

      const check = await checkRoomAvailability({
        roomId: input.roomId,
        llegada: input.llegada,
        salida: input.salida,
        adultos: input.adultos,
        ninos: input.ninos,
        today: t,
        ignoreSessionId: input.sessionId,
      });
      if (!check.ok) {
        return { ok: false as const, message: check.message, reason: check.reason };
      }

      const expiraEn = new Date(Date.now() + HOLD_TTL_MIN * 60_000);
      if (existing) {
        await tx.bookingHold.update({ where: { id: existing.id }, data: { expiraEn } });
        return { ok: true as const, holdId: existing.id, expiraEn };
      }
      // Una sesión sólo mantiene una retención por habitación a la vez.
      await tx.bookingHold.deleteMany({
        where: { roomId: input.roomId, sessionId: input.sessionId, bookingId: null },
      });
      const hold = await tx.bookingHold.create({
        data: {
          roomId: input.roomId,
          llegada: input.llegada,
          salida: input.salida,
          sessionId: input.sessionId,
          expiraEn,
        },
      });
      return { ok: true as const, holdId: hold.id, expiraEn };
    });
  } catch (err) {
    console.error("createOrRenewHold", err);
    return { ok: false, message: "No pudimos apartar la habitación. Intenta de nuevo.", reason: "error" };
  }
}

export async function getSessionHolds(sessionId: string) {
  if (!sessionId) return [];
  await releaseExpiredHolds();
  return db.bookingHold.findMany({
    where: { sessionId, expiraEn: { gt: new Date() } },
    include: { room: { select: { slug: true, nombre: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function releaseHold(holdId: string, sessionId: string): Promise<void> {
  await db.bookingHold.deleteMany({ where: { id: holdId, sessionId, bookingId: null } });
}
