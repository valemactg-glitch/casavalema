import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, bad } from "@/lib/http";
import { getGateway } from "@/lib/payments/gateway";
import { notifyBooking } from "@/lib/email/send";

/**
 * Webhook de la pasarela: fuente de verdad del estado de un pago.
 * El retorno del navegador nunca confirma por sí solo.
 * Cuerpo esperado (normalizado): { referencia, estado, proveedorRef? }
 * estado ∈ APROBADO | RECHAZADO | PENDIENTE | CANCELADO | EXPIRADO
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const gateway = getGateway();
  const { valido } = gateway.verifyWebhook(req.headers, raw);

  const secret = process.env.PAYMENTS_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-valema-signature") !== secret) {
    return bad("Firma inválida", 401);
  }
  if (!valido) return bad("Webhook no verificado", 401);

  let body: { referencia?: string; estado?: string; proveedorRef?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return bad("JSON inválido");
  }
  if (!body.referencia || !body.estado) return bad("Faltan campos");

  const payment = await db.payment.findUnique({
    where: { referencia: body.referencia },
    include: { booking: true },
  });
  if (!payment) return bad("Pago no encontrado", 404);

  const nuevo = body.estado.toUpperCase();
  if (!["APROBADO", "RECHAZADO", "PENDIENTE", "CANCELADO", "EXPIRADO", "REEMBOLSADO"].includes(nuevo)) {
    return bad("Estado no reconocido");
  }

  // Idempotencia: si ya está en ese estado, no repetir efectos.
  if (payment.estado === nuevo) return json({ ok: true, sinCambios: true });

  await db.payment.update({
    where: { id: payment.id },
    data: { estado: nuevo as never, proveedorRef: body.proveedorRef ?? payment.proveedorRef },
  });

  const b = payment.booking;
  if (nuevo === "APROBADO") {
    const abonado =
      (
        await db.payment.aggregate({
          where: { bookingId: b.id, estado: "APROBADO" },
          _sum: { valor: true },
        })
      )._sum.valor ?? 0;
    const estado = abonado >= b.anticipo ? "CONFIRMADA" : "PAGO_PARCIAL";
    await db.$transaction([
      db.booking.update({
        where: { id: b.id },
        data: {
          estado: estado as never,
          saldo: Math.max(0, b.total - abonado),
          holdExpiraEn: estado === "CONFIRMADA" ? null : b.holdExpiraEn,
        },
      }),
      db.bookingEvent.create({
        data: {
          bookingId: b.id,
          tipo: "pago",
          detalle: `Webhook: pago ${payment.referencia} aprobado`,
          valorAnterior: b.estado,
          valorNuevo: estado,
          actor: "pasarela",
        },
      }),
      db.bookingHold.deleteMany({ where: { bookingId: b.id } }),
    ]);
    await Promise.allSettled([
      notifyBooking(b.id, "transferencia_aprobada"),
      ...(estado === "CONFIRMADA" ? [notifyBooking(b.id, "reserva_confirmada")] : []),
    ]);
  } else if (["RECHAZADO", "CANCELADO", "EXPIRADO"].includes(nuevo)) {
    await db.bookingEvent.create({
      data: {
        bookingId: b.id,
        tipo: "pago",
        detalle: `Webhook: pago ${payment.referencia} ${nuevo.toLowerCase()}`,
        actor: "pasarela",
      },
    });
  }

  return json({ ok: true });
}
