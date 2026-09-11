"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertCan, logActivity } from "@/lib/auth/session";
import { parseISODate, nights, today } from "@/lib/dates";
import { checkRoomAvailability } from "@/lib/booking/availability";
import { withRoomLock } from "@/lib/booking/lock";
import { quote } from "@/lib/booking/pricing";
import { generateBookingCode } from "@/lib/booking/codes";
import { notifyBooking } from "@/lib/email/send";

async function load(codigo: string) {
  return db.booking.findUnique({
    where: { codigo },
    include: { room: true, guest: true, payments: true },
  });
}

const setEstado = async (
  codigo: string,
  nuevo: string,
  accion: string,
  detalle: string,
  campos: Record<string, unknown> = {},
) => {
  const user = await assertCan("reservas");
  const b = await load(codigo);
  if (!b) return;
  await db.$transaction([
    db.booking.update({ where: { id: b.id }, data: { estado: nuevo as never, ...campos } }),
    db.bookingEvent.create({
      data: { bookingId: b.id, tipo: "estado", detalle, valorAnterior: b.estado, valorNuevo: nuevo, actor: user.nombre },
    }),
  ]);
  await logActivity({ user, accion, entidad: `Booking:${codigo}`, valorAnterior: b.estado, valorNuevo: nuevo });
  revalidatePath(`/admin/reservas/${codigo}`);
  revalidatePath("/admin/reservas");
};

export async function checkIn(formData: FormData) {
  await setEstado(String(formData.get("codigo")), "EN_CURSO", "reserva.checkin", "Check-in realizado", {
    checkInAt: new Date(),
  });
}
export async function checkOut(formData: FormData) {
  await setEstado(String(formData.get("codigo")), "COMPLETADA", "reserva.checkout", "Check-out realizado", {
    checkOutAt: new Date(),
    estadoLimpieza: "pendiente",
  });
}
export async function marcarNoShow(formData: FormData) {
  await setEstado(String(formData.get("codigo")), "NO_SHOW", "reserva.noshow", "Marcada como no-show");
}
export async function cancelar(formData: FormData) {
  const codigo = String(formData.get("codigo"));
  await setEstado(codigo, "CANCELADA", "reserva.cancelar", "Reserva cancelada por el equipo");
  const b = await load(codigo);
  if (b) await notifyBooking(b.id, "reserva_cancelada").catch(() => {});
}

export async function reembolsar(formData: FormData) {
  const user = await assertCan("pagos");
  const codigo = String(formData.get("codigo"));
  const monto = Number(formData.get("monto"));
  const b = await load(codigo);
  if (!b || !Number.isFinite(monto) || monto <= 0) return;
  const abonado = b.payments.filter((p) => p.estado === "APROBADO").reduce((s, p) => s + p.valor, 0);
  const parcial = monto < abonado;
  await db.$transaction([
    db.payment.create({
      data: {
        bookingId: b.id,
        referencia: `REF-${codigo}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
        metodo: "TRANSFERENCIA",
        estado: "REEMBOLSADO",
        valor: -monto,
        proveedor: "manual",
      },
    }),
    db.booking.update({ where: { id: b.id }, data: { estado: parcial ? "REEMBOLSO_PARCIAL" : "REEMBOLSADA" } }),
    db.bookingEvent.create({
      data: { bookingId: b.id, tipo: "pago", detalle: `Reembolso de ${monto.toLocaleString("es-CO")} COP`, actor: user.nombre },
    }),
  ]);
  await logActivity({ user, accion: "pago.reembolso", entidad: `Booking:${codigo}`, valorNuevo: String(monto) });
  await notifyBooking(b.id, "reembolso_iniciado", `Monto: ${monto.toLocaleString("es-CO")} COP`).catch(() => {});
  revalidatePath(`/admin/reservas/${codigo}`);
}

export async function agregarNota(formData: FormData) {
  const user = await assertCan("reservas");
  const codigo = String(formData.get("codigo"));
  const nota = String(formData.get("nota") ?? "").trim();
  if (nota.length < 2) return;
  const b = await load(codigo);
  if (!b) return;
  await db.$transaction([
    db.booking.update({
      where: { id: b.id },
      data: { notasInternas: [b.notasInternas, `${new Date().toLocaleDateString("es-CO")} · ${user.nombre}: ${nota}`].filter(Boolean).join("\n") },
    }),
    db.bookingEvent.create({ data: { bookingId: b.id, tipo: "nota", detalle: nota, actor: user.nombre } }),
  ]);
  revalidatePath(`/admin/reservas/${codigo}`);
}

export async function reenviarConfirmacion(formData: FormData) {
  const user = await assertCan("reservas");
  const codigo = String(formData.get("codigo"));
  const b = await load(codigo);
  if (!b) return;
  await notifyBooking(b.id, b.estado === "CONFIRMADA" ? "reserva_confirmada" : "reserva_recibida").catch(() => {});
  await logActivity({ user, accion: "reserva.reenviar", entidad: `Booking:${codigo}` });
}

export async function registrarPagoManual(formData: FormData) {
  const user = await assertCan("pagos");
  const codigo = String(formData.get("codigo"));
  const valor = Number(formData.get("valor"));
  const metodo = String(formData.get("metodo") ?? "TRANSFERENCIA");
  const b = await load(codigo);
  if (!b || !Number.isFinite(valor) || valor <= 0) return;
  const abonado = b.payments.filter((p) => p.estado === "APROBADO").reduce((s, p) => s + p.valor, 0) + valor;
  await db.$transaction([
    db.payment.create({
      data: {
        bookingId: b.id,
        referencia: `MAN-${codigo}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
        metodo: metodo as never,
        estado: "APROBADO",
        valor,
        proveedor: "manual",
      },
    }),
    db.booking.update({
      where: { id: b.id },
      data: {
        saldo: Math.max(0, b.total - abonado),
        estado: abonado >= b.anticipo ? "CONFIRMADA" : "PAGO_PARCIAL",
      },
    }),
    db.bookingEvent.create({
      data: { bookingId: b.id, tipo: "pago", detalle: `Pago manual ${metodo} de ${valor.toLocaleString("es-CO")} COP`, actor: user.nombre },
    }),
  ]);
  await logActivity({ user, accion: "pago.manual", entidad: `Booking:${codigo}`, valorNuevo: String(valor) });
  revalidatePath(`/admin/reservas/${codigo}`);
}

// ── Reserva manual ─────────────────────────────────────────────

const manualSchema = z.object({
  roomId: z.string().min(1),
  llegada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  salida: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adultos: z.coerce.number().int().min(1).max(8),
  ninos: z.coerce.number().int().min(0).max(6),
  canal: z.enum(["DIRECTO", "AIRBNB", "WHATSAPP", "TELEFONO"]),
  nombre: z.string().trim().min(2),
  apellidos: z.string().trim().min(2),
  telefono: z.string().trim().min(5),
  correo: z.string().trim().email(),
  estado: z.enum(["PENDIENTE_PAGO", "CONFIRMADA"]),
  notas: z.string().trim().max(500).optional().or(z.literal("")),
});

export type ManualState = { error?: string };

export async function crearReservaManual(_prev: ManualState, formData: FormData): Promise<ManualState> {
  const user = await assertCan("reservas");
  const parsed = manualSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };

  const llegada = parseISODate(parsed.data.llegada)!;
  const salida = parseISODate(parsed.data.salida)!;
  if (salida <= llegada) return { error: "La salida debe ser posterior a la llegada." };

  const room = await db.room.findUnique({ where: { id: parsed.data.roomId }, include: { ratePlans: { where: { activo: true } } } });
  if (!room) return { error: "Habitación no encontrada." };
  const plan = room.ratePlans.find((p) => p.reembolsable) ?? room.ratePlans[0];

  let codigo = "";
  try {
    await withRoomLock(room.id, async (tx) => {
      const check = await checkRoomAvailability({
        roomId: room.id,
        llegada,
        salida,
        adultos: parsed.data.adultos,
        ninos: parsed.data.ninos,
        today: today(),
      });
      if (!check.ok && parsed.data.canal !== "AIRBNB") {
        throw new Error(check.message);
      }
      const rows = await tx.availability.findMany({ where: { roomId: room.id, fecha: { gte: llegada, lt: salida } } });
      const q = plan
        ? quote({ availability: rows, ratePlan: plan })
        : { subtotal: 0, total: 0, anticipo: 0, saldo: 0, descuento: 0, impuestos: 0, serviciosTotal: 0, noches: nights(llegada, salida), nightly: [], anticipoPct: 30, reembolsable: true, politicaCancelacion: "", descuentoPct: 0 };
      codigo = await generateBookingCode();
      const guest = await tx.guest.create({
        data: {
          nombre: parsed.data.nombre,
          apellidos: parsed.data.apellidos,
          docNumero: "",
          telefono: parsed.data.telefono,
          correo: parsed.data.correo.toLowerCase(),
          consentimientos: { politicas: true, datos: true, porAdmin: true },
        },
      });
      await tx.booking.create({
        data: {
          codigo,
          roomId: room.id,
          ratePlanId: plan?.id,
          guestId: guest.id,
          llegada,
          salida,
          noches: nights(llegada, salida),
          adultos: parsed.data.adultos,
          ninos: parsed.data.ninos,
          estado: parsed.data.estado,
          canal: parsed.data.canal,
          subtotal: q.subtotal,
          descuento: q.descuento,
          total: q.total,
          anticipo: q.anticipo,
          saldo: parsed.data.estado === "CONFIRMADA" ? Math.max(0, q.total - q.anticipo) : q.total,
          notasInternas: parsed.data.notas || null,
          events: { create: { tipo: "estado", detalle: `Reserva manual creada (${parsed.data.canal})`, valorNuevo: parsed.data.estado, actor: user.nombre } },
        },
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo crear la reserva." };
  }

  await logActivity({ user, accion: "reserva.crear-manual", entidad: `Booking:${codigo}` });
  revalidatePath("/admin/reservas");
  revalidatePath("/admin/calendario");
  redirect(`/admin/reservas/${codigo}`);
}
