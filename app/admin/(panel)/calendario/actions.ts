"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertCan, logActivity } from "@/lib/auth/session";
import { parseISODate, eachNight, formatRangeEs, toISODate } from "@/lib/dates";
import { OCCUPYING_STATES } from "@/lib/booking/availability";
import { syncRoomIcal } from "@/lib/ical";

const bloqueoSchema = z.object({
  roomId: z.string().min(1),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tipo: z.enum(["MANUAL", "MANTENIMIENTO", "CORTESIA"]),
  motivo: z.string().trim().max(200).optional().or(z.literal("")),
});

export type BloqueoState =
  | { fase: "idle" }
  | { fase: "error"; mensaje: string }
  | {
      fase: "preview";
      datos: z.infer<typeof bloqueoSchema>;
      roomNombre: string;
      noches: number;
      reservasAfectadas: { codigo: string; rango: string }[];
    }
  | { fase: "ok"; mensaje: string };

export async function previsualizarBloqueo(_prev: BloqueoState, formData: FormData): Promise<BloqueoState> {
  await assertCan("calendario");
  const parsed = bloqueoSchema.safeParse({
    roomId: formData.get("roomId"),
    desde: formData.get("desde"),
    hasta: formData.get("hasta"),
    tipo: formData.get("tipo"),
    motivo: formData.get("motivo"),
  });
  if (!parsed.success) return { fase: "error", mensaje: "Revisa la habitación y las fechas." };

  const desde = parseISODate(parsed.data.desde)!;
  const hasta = parseISODate(parsed.data.hasta)!;
  if (hasta <= desde) return { fase: "error", mensaje: "La fecha final debe ser posterior a la inicial." };

  const room = await db.room.findUnique({ where: { id: parsed.data.roomId }, select: { nombre: true } });
  if (!room) return { fase: "error", mensaje: "Habitación no encontrada." };

  const afectadas = await db.booking.findMany({
    where: {
      roomId: parsed.data.roomId,
      estado: { in: [...OCCUPYING_STATES, "PENDIENTE_PAGO"] },
      llegada: { lt: hasta },
      salida: { gt: desde },
    },
    select: { codigo: true, llegada: true, salida: true },
  });

  return {
    fase: "preview",
    datos: parsed.data,
    roomNombre: room.nombre,
    noches: eachNight(desde, hasta).length,
    reservasAfectadas: afectadas.map((b) => ({ codigo: b.codigo, rango: formatRangeEs(b.llegada, b.salida) })),
  };
}

export async function aplicarBloqueo(formData: FormData): Promise<void> {
  const user = await assertCan("calendario");
  const parsed = bloqueoSchema.parse({
    roomId: formData.get("roomId"),
    desde: formData.get("desde"),
    hasta: formData.get("hasta"),
    tipo: formData.get("tipo"),
    motivo: formData.get("motivo"),
  });
  const desde = parseISODate(parsed.desde)!;
  const hasta = parseISODate(parsed.hasta)!;
  const room = await db.room.findUniqueOrThrow({ where: { id: parsed.roomId }, select: { nombre: true } });

  await db.block.create({
    data: {
      roomId: parsed.roomId,
      desde,
      hasta,
      tipo: parsed.tipo,
      motivo: parsed.motivo || null,
      origen: `admin:${user.nombre}`,
    },
  });
  await logActivity({
    user,
    accion: "bloqueo.crear",
    entidad: `Room:${room.nombre}`,
    detalle: `${parsed.tipo} · ${formatRangeEs(desde, hasta)}${parsed.motivo ? ` · ${parsed.motivo}` : ""}`,
  });
  revalidatePath("/admin/calendario");
}

export async function quitarBloqueo(formData: FormData): Promise<void> {
  const user = await assertCan("calendario");
  const id = String(formData.get("id") ?? "");
  const block = await db.block.findUnique({ where: { id }, include: { room: { select: { nombre: true } } } });
  if (!block) return;
  await db.block.delete({ where: { id } });
  await logActivity({
    user,
    accion: "bloqueo.quitar",
    entidad: `Room:${block.room.nombre}`,
    detalle: `${block.tipo} · ${formatRangeEs(block.desde, block.hasta)}`,
  });
  revalidatePath("/admin/calendario");
}

export async function sincronizarIcal(formData: FormData): Promise<void> {
  const user = await assertCan("calendario");
  const roomId = String(formData.get("roomId") ?? "");
  const res = await syncRoomIcal(roomId);
  await logActivity({
    user,
    accion: "ical.sync",
    entidad: `Room:${roomId}`,
    detalle: `${res.mensaje} · ${res.eventos} eventos`,
  });
  revalidatePath("/admin/calendario");
}

export async function guardarEnlaceIcal(formData: FormData): Promise<void> {
  const user = await assertCan("calendario");
  const roomId = String(formData.get("roomId") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  await db.icalLink.upsert({
    where: { roomId },
    create: { roomId, urlEntrada: url || null },
    update: { urlEntrada: url || null },
  });
  await logActivity({ user, accion: "ical.enlace", entidad: `Room:${roomId}`, detalle: url ? "actualizado" : "eliminado" });
  revalidatePath("/admin/calendario");
}

export { toISODate };
