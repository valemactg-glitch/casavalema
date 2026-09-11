import "server-only";
import type { BookingInput } from "@/lib/validation";
import { db } from "@/lib/db";
import { parseISODate, today, nights } from "@/lib/dates";
import { checkRoomAvailability } from "@/lib/booking/availability";
import { withRoomLock } from "@/lib/booking/lock";
import { quote, serviceCharge, type ServiceLine } from "@/lib/booking/pricing";
import { generateBookingCode } from "@/lib/booking/codes";

export type CreateBookingResult =
  | {
      ok: true;
      bookingId: string;
      codigo: string;
      gestionToken: string;
      total: number;
      anticipo: number;
      saldo: number;
    }
  | { ok: false; code: number; message: string; reason?: string };

export async function createBooking(
  input: BookingInput,
  sessionId: string,
): Promise<CreateBookingResult> {
  const llegada = parseISODate(input.llegada);
  const salida = parseISODate(input.salida);
  if (!llegada || !salida) return { ok: false, code: 400, message: "Fechas inválidas." };

  const room = await db.room.findFirst({
    where: { slug: input.habitacion, visible: true },
    include: { ratePlans: { where: { activo: true } } },
  });
  if (!room) return { ok: false, code: 404, message: "La habitación no existe." };

  const plan = room.ratePlans.find((p) => p.id === input.planId) ?? room.ratePlans[0];
  if (!plan) return { ok: false, code: 400, message: "Tarifa no disponible." };

  const t = today();
  const noches = nights(llegada, salida);

  // Servicios: validar y cotizar en el servidor.
  const serviciosDb = input.servicios.length
    ? await db.service.findMany({
        where: {
          id: { in: input.servicios.map((s) => s.serviceId) },
          activo: true,
          disponibilidad: { not: "NO_DISPONIBLE" },
        },
      })
    : [];
  const serviceLines: ServiceLine[] = [];
  for (const req of input.servicios) {
    const svc = serviciosDb.find((s) => s.id === req.serviceId);
    if (!svc) continue;
    const { cantidad, subtotal } = serviceCharge({
      precio: svc.precio,
      tipoCobro: svc.tipoCobro,
      cantidadSolicitada: req.cantidad,
      noches,
    });
    serviceLines.push({
      serviceId: svc.id,
      nombre: svc.nombre,
      precioUnit: svc.precio,
      cantidad,
      tipoCobro: svc.tipoCobro,
      subtotal,
    });
  }

  try {
    return await withRoomLock(room.id, async (tx) => {
      // Revalidar disponibilidad, ignorando la propia retención de esta sesión.
      const check = await checkRoomAvailability({
        roomId: room.id,
        llegada,
        salida,
        adultos: input.adultos,
        ninos: input.ninos,
        today: t,
        ignoreSessionId: sessionId,
      });
      if (!check.ok) {
        return {
          ok: false as const,
          code: 409,
          message: check.message,
          reason: check.reason,
        };
      }

      const q = quote({ availability: check.availability, ratePlan: plan, servicios: serviceLines });
      const codigo = await generateBookingCode();
      const holdTtl = Math.max(3, Number(process.env.HOLD_TTL_MINUTES ?? 15));
      const holdExpiraEn = new Date(Date.now() + holdTtl * 60_000);

      const guest = await tx.guest.create({
        data: {
          nombre: input.guest.nombre,
          apellidos: input.guest.apellidos,
          docTipo: input.guest.docTipo as never,
          docNumero: input.guest.docNumero,
          pais: input.guest.pais,
          ciudad: input.guest.ciudad || null,
          telefono: input.guest.telefono,
          correo: input.guest.correo.toLowerCase(),
          consentimientos: {
            politicas: true,
            datos: true,
            comunicaciones: !!input.consentimientos.comunicaciones,
            fecha: new Date().toISOString(),
          },
        },
      });

      const booking = await tx.booking.create({
        data: {
          codigo,
          roomId: room.id,
          ratePlanId: plan.id,
          guestId: guest.id,
          llegada,
          salida,
          noches,
          adultos: input.adultos,
          ninos: input.ninos,
          estado: "PENDIENTE_PAGO",
          canal: "DIRECTO",
          subtotal: q.subtotal,
          serviciosTotal: q.serviciosTotal,
          descuento: q.descuento,
          impuestos: q.impuestos,
          total: q.total,
          anticipo: q.anticipo,
          saldo: q.saldo,
          codigoPromocional: input.codigoPromocional || null,
          horaLlegada: input.horaLlegada || null,
          solicitudes: input.solicitudes || null,
          reservaParaOtro: !!input.reservaParaOtro,
          facturacion: input.facturacion ?? undefined,
          holdExpiraEn,
          companions: {
            create: input.companions.map((c) => ({
              nombre: c.nombre,
              docNumero: c.docNumero || null,
              esMenor: !!c.esMenor,
              edad: c.edad ?? null,
            })),
          },
          services: {
            create: serviceLines.map((l) => ({
              serviceId: l.serviceId,
              cantidad: l.cantidad,
              precioUnit: l.precioUnit,
              tipoCobro: l.tipoCobro as never,
              subtotal: l.subtotal,
            })),
          },
          events: {
            create: {
              tipo: "estado",
              detalle: "Reserva creada, pendiente de pago",
              valorNuevo: "PENDIENTE_PAGO",
              actor: "huésped",
            },
          },
        },
      });

      // Consumir la retención de esta sesión para estas fechas.
      await tx.bookingHold.updateMany({
        where: { roomId: room.id, sessionId, bookingId: null, llegada, salida },
        data: { bookingId: booking.id, expiraEn: holdExpiraEn },
      });

      return {
        ok: true as const,
        bookingId: booking.id,
        codigo,
        gestionToken: booking.gestionToken,
        total: q.total,
        anticipo: q.anticipo,
        saldo: q.saldo,
      };
    });
  } catch (err) {
    console.error("createBooking", err);
    return { ok: false, code: 500, message: "No pudimos crear la reserva. Intenta de nuevo." };
  }
}
