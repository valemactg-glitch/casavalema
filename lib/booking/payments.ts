import "server-only";
import { db } from "@/lib/db";
import { getGateway, type PaymentMethod, type PaymentModalidad } from "@/lib/payments/gateway";
import { paymentReference } from "@/lib/booking/codes";
import { notifyBooking } from "@/lib/email/send";
import { SITE_URL as SITE } from "@/lib/site";

export type StartPaymentResult =
  | {
      ok: true;
      estado: "APROBADO" | "PENDIENTE" | "RECHAZADO";
      bookingEstado: string;
      codigo: string;
      referencia: string;
      redirectUrl: string;
    }
  | { ok: false; code: number; message: string };

/** Suma de pagos que cuentan como abonados (aprobados). */
async function paidSoFar(bookingId: string): Promise<number> {
  const rows = await db.payment.aggregate({
    where: { bookingId, estado: "APROBADO" },
    _sum: { valor: true },
  });
  return rows._sum.valor ?? 0;
}

export async function startPayment(params: {
  bookingId: string;
  metodo: PaymentMethod;
  modalidad: PaymentModalidad;
}): Promise<StartPaymentResult> {
  const booking = await db.booking.findUnique({
    where: { id: params.bookingId },
    include: { guest: true, room: { select: { nombre: true } } },
  });
  if (!booking) return { ok: false, code: 404, message: "Reserva no encontrada." };

  if (!["PENDIENTE_PAGO", "PAGO_PARCIAL"].includes(booking.estado)) {
    return {
      ok: false,
      code: 409,
      message:
        booking.estado === "CANCELADA"
          ? "Esta reserva se canceló porque la retención venció. Vuelve a buscar disponibilidad."
          : "Esta reserva ya no admite pagos.",
    };
  }

  const abonado = await paidSoFar(booking.id);
  const objetivo = params.modalidad === "total" ? booking.total : booking.anticipo;
  const valor = Math.max(0, objetivo - abonado);
  if (valor <= 0) {
    return { ok: false, code: 409, message: "Este monto ya está pagado." };
  }

  const referencia = paymentReference(booking.codigo);
  const gateway = getGateway();
  const returnUrl = `${SITE}/reserva/${booking.codigo}?ref=${referencia}`;

  const res = await gateway.createPayment({
    referencia,
    bookingCodigo: booking.codigo,
    metodo: params.metodo,
    valor,
    moneda: "COP",
    correo: booking.guest.correo,
    descripcion: `${booking.room.nombre} · ${booking.codigo}`,
    returnUrl,
  });

  await db.payment.create({
    data: {
      bookingId: booking.id,
      referencia,
      metodo: params.metodo,
      estado: res.estado === "APROBADO" ? "APROBADO" : res.estado === "RECHAZADO" ? "RECHAZADO" : "PENDIENTE",
      valor,
      proveedor: res.proveedor,
      proveedorRef: res.proveedorRef,
      detalle: { modalidad: params.modalidad },
    },
  });

  let bookingEstado = booking.estado;

  if (res.estado === "APROBADO") {
    const total = abonado + valor;
    bookingEstado =
      total >= booking.total ? "CONFIRMADA" : total >= booking.anticipo ? "CONFIRMADA" : "PAGO_PARCIAL";
    await db.$transaction([
      db.booking.update({
        where: { id: booking.id },
        data: {
          estado: bookingEstado as never,
          saldo: Math.max(0, booking.total - total),
          holdExpiraEn: bookingEstado === "CONFIRMADA" ? null : booking.holdExpiraEn,
        },
      }),
      db.bookingEvent.create({
        data: {
          bookingId: booking.id,
          tipo: "pago",
          detalle: `Pago ${params.metodo} aprobado por ${valor.toLocaleString("es-CO")} COP`,
          valorAnterior: booking.estado,
          valorNuevo: bookingEstado,
          actor: "huésped",
        },
      }),
      ...(bookingEstado === "CONFIRMADA"
        ? [db.bookingHold.deleteMany({ where: { bookingId: booking.id } })]
        : []),
    ]);
  } else if (res.estado === "PENDIENTE") {
    await db.bookingEvent.create({
      data: {
        bookingId: booking.id,
        tipo: "pago",
        detalle: `Transferencia registrada, pendiente de verificación (${valor.toLocaleString("es-CO")} COP)`,
        actor: "huésped",
      },
    });
  } else {
    await db.bookingEvent.create({
      data: {
        bookingId: booking.id,
        tipo: "pago",
        detalle: `Pago ${params.metodo} rechazado`,
        actor: "huésped",
      },
    });
  }

  await Promise.allSettled(
    res.estado === "APROBADO"
      ? [
          notifyBooking(booking.id, "pago_aprobado"),
          ...(bookingEstado === "CONFIRMADA" ? [notifyBooking(booking.id, "reserva_confirmada")] : []),
        ]
      : res.estado === "PENDIENTE"
        ? [notifyBooking(booking.id, "transferencia_pendiente")]
        : [notifyBooking(booking.id, "pago_rechazado")],
  );

  return {
    ok: true,
    estado: res.estado,
    bookingEstado,
    codigo: booking.codigo,
    referencia,
    redirectUrl: res.redirectUrl,
  };
}
