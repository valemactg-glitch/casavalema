"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan, logActivity } from "@/lib/auth/session";
import { notifyBooking } from "@/lib/email/send";

export async function aprobarTransferencia(formData: FormData) {
  const user = await assertCan("pagos");
  const id = String(formData.get("id"));
  const payment = await db.payment.findUnique({ where: { id }, include: { booking: true } });
  if (!payment || payment.estado !== "PENDIENTE") return;

  const b = payment.booking;
  const abonado =
    ((await db.payment.aggregate({ where: { bookingId: b.id, estado: "APROBADO" }, _sum: { valor: true } }))._sum.valor ?? 0) +
    payment.valor;
  const estado = abonado >= b.anticipo ? "CONFIRMADA" : "PAGO_PARCIAL";

  await db.$transaction([
    db.payment.update({ where: { id }, data: { estado: "APROBADO" } }),
    db.booking.update({
      where: { id: b.id },
      data: { estado: estado as never, saldo: Math.max(0, b.total - abonado), holdExpiraEn: estado === "CONFIRMADA" ? null : b.holdExpiraEn },
    }),
    db.bookingEvent.create({
      data: { bookingId: b.id, tipo: "pago", detalle: `Transferencia ${payment.referencia} verificada y aprobada`, valorAnterior: b.estado, valorNuevo: estado, actor: user.nombre },
    }),
    db.bookingHold.deleteMany({ where: { bookingId: b.id } }),
  ]);
  await logActivity({ user, accion: "pago.aprobar-transferencia", entidad: `Booking:${b.codigo}`, valorNuevo: String(payment.valor) });
  await notifyBooking(b.id, "transferencia_aprobada").catch(() => {});
  revalidatePath("/admin/pagos");
  revalidatePath(`/admin/reservas/${b.codigo}`);
}

export async function rechazarTransferencia(formData: FormData) {
  const user = await assertCan("pagos");
  const id = String(formData.get("id"));
  const motivo = String(formData.get("motivo") ?? "").trim();
  const payment = await db.payment.findUnique({ where: { id }, include: { booking: true } });
  if (!payment || payment.estado !== "PENDIENTE") return;
  await db.$transaction([
    db.payment.update({ where: { id }, data: { estado: "RECHAZADO", detalle: { motivo } } }),
    db.bookingEvent.create({
      data: { bookingId: payment.bookingId, tipo: "pago", detalle: `Transferencia ${payment.referencia} rechazada${motivo ? `: ${motivo}` : ""}`, actor: user.nombre },
    }),
  ]);
  await logActivity({ user, accion: "pago.rechazar-transferencia", entidad: `Booking:${payment.booking.codigo}` });
  revalidatePath("/admin/pagos");
}
