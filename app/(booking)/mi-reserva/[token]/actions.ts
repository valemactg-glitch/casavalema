"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { today } from "@/lib/dates";
import { notifyBooking } from "@/lib/email/send";

async function loadByToken(token: string) {
  return db.booking.findUnique({
    where: { gestionToken: token },
    include: { guest: true },
  });
}

export type ActionState = { ok: boolean; message?: string; error?: string };

const contactoSchema = z.object({
  telefono: z.string().trim().min(7, "Teléfono no válido."),
  correo: z.string().trim().email("Correo no válido."),
  horaLlegada: z.string().trim().max(20).optional().or(z.literal("")),
});

export async function actualizarContacto(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const booking = await loadByToken(token);
  if (!booking) return { ok: false, error: "Reserva no encontrada." };

  const parsed = contactoSchema.safeParse({
    telefono: formData.get("telefono"),
    correo: formData.get("correo"),
    horaLlegada: formData.get("horaLlegada"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  await db.$transaction([
    db.guest.update({
      where: { id: booking.guestId },
      data: { telefono: parsed.data.telefono, correo: parsed.data.correo.toLowerCase() },
    }),
    db.booking.update({
      where: { id: booking.id },
      data: { horaLlegada: parsed.data.horaLlegada || null },
    }),
    db.bookingEvent.create({
      data: {
        bookingId: booking.id,
        tipo: "nota",
        detalle: "El huésped actualizó sus datos de contacto / hora de llegada",
        actor: "huésped",
      },
    }),
  ]);

  revalidatePath(`/mi-reserva/${token}`);
  return { ok: true, message: "Datos actualizados." };
}

export async function agregarAcompanante(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const booking = await loadByToken(token);
  if (!booking) return { ok: false, error: "Reserva no encontrada." };

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (nombre.length < 2) return { ok: false, error: "Escribe el nombre del acompañante." };
  const esMenor = formData.get("esMenor") === "on";
  const edadRaw = Number(formData.get("edad"));

  const count = await db.companion.count({ where: { bookingId: booking.id } });
  if (count + 1 + 1 > booking.adultos + booking.ninos) {
    return {
      ok: false,
      error: "El número de acompañantes supera la capacidad reservada. Escríbenos para ampliarla.",
    };
  }

  await db.$transaction([
    db.companion.create({
      data: {
        bookingId: booking.id,
        nombre,
        esMenor,
        edad: Number.isFinite(edadRaw) && edadRaw > 0 ? edadRaw : null,
      },
    }),
    db.bookingEvent.create({
      data: {
        bookingId: booking.id,
        tipo: "nota",
        detalle: `El huésped agregó al acompañante ${nombre}`,
        actor: "huésped",
      },
    }),
  ]);

  revalidatePath(`/mi-reserva/${token}`);
  return { ok: true, message: "Acompañante agregado." };
}

const solicitudSchema = z.object({
  tipo: z.enum(["FECHAS", "CANCELACION", "SERVICIOS", "OTRO"]),
  detalle: z.string().trim().min(5, "Cuéntanos un poco más."),
});

export async function crearSolicitud(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const booking = await loadByToken(token);
  if (!booking) return { ok: false, error: "Reserva no encontrada." };
  if (["CANCELADA", "COMPLETADA", "NO_SHOW"].includes(booking.estado)) {
    return { ok: false, error: "Esta reserva ya no admite solicitudes. Escríbenos por WhatsApp." };
  }

  const parsed = solicitudSchema.safeParse({
    tipo: formData.get("tipo"),
    detalle: formData.get("detalle"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa la solicitud." };
  }

  await db.$transaction([
    db.changeRequest.create({
      data: {
        bookingId: booking.id,
        tipo: parsed.data.tipo,
        detalle: parsed.data.detalle,
        estado: "EN_REVISION",
      },
    }),
    db.bookingEvent.create({
      data: {
        bookingId: booking.id,
        tipo: "nota",
        detalle: `Solicitud de ${parsed.data.tipo.toLowerCase()} recibida`,
        actor: "huésped",
      },
    }),
  ]);

  await notifyBooking(booking.id, "solicitud_cambio_recibida", parsed.data.detalle).catch(() => {});

  revalidatePath(`/mi-reserva/${token}`);
  return {
    ok: true,
    message:
      "Solicitud registrada. La revisamos según la política y te contactamos. Nada se aprueba automáticamente.",
  };
}

const resenaSchema = z.object({
  autor: z.string().trim().min(2, "Escribe tu nombre o iniciales."),
  limpieza: z.coerce.number().int().min(1).max(5),
  ubicacion: z.coerce.number().int().min(1).max(5),
  atencion: z.coerce.number().int().min(1).max(5),
  comodidad: z.coerce.number().int().min(1).max(5),
  precio: z.coerce.number().int().min(1).max(5),
  texto: z.string().trim().min(20, "Cuéntanos un poco más (mínimo 20 caracteres)."),
});

export async function dejarResena(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const booking = await db.booking.findUnique({
    where: { gestionToken: token },
    include: { review: true },
  });
  if (!booking) return { ok: false, error: "Reserva no encontrada." };
  if (new Date(booking.salida) > today()) {
    return { ok: false, error: "Podrás dejar tu reseña después del check-out." };
  }
  if (booking.review) return { ok: false, error: "Ya dejaste una reseña para esta reserva." };

  const parsed = resenaSchema.safeParse({
    autor: formData.get("autor"),
    limpieza: formData.get("limpieza"),
    ubicacion: formData.get("ubicacion"),
    atencion: formData.get("atencion"),
    comodidad: formData.get("comodidad"),
    precio: formData.get("precio"),
    texto: formData.get("texto"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa la reseña." };
  }

  await db.review.create({
    data: {
      bookingId: booking.id,
      roomId: booking.roomId,
      autor: parsed.data.autor,
      fechaEstadia: booking.salida,
      limpieza: parsed.data.limpieza,
      ubicacion: parsed.data.ubicacion,
      atencion: parsed.data.atencion,
      comodidad: parsed.data.comodidad,
      precio: parsed.data.precio,
      texto: parsed.data.texto,
      estado: "PENDIENTE",
    },
  });

  revalidatePath(`/mi-reserva/${token}`);
  return { ok: true, message: "¡Gracias! Tu reseña quedó pendiente de aprobación." };
}
