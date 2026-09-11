"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertCan, logActivity } from "@/lib/auth/session";
import { AMENIDADES } from "@/lib/catalog";

export type RoomState = { ok?: boolean; error?: string };

const schema = z.object({
  id: z.string().min(1),
  nombre: z.string().trim().min(2),
  descripcionCorta: z.string().trim().min(10),
  descripcionLarga: z.string().trim().min(20),
  capacidadAdultos: z.coerce.number().int().min(1).max(8),
  capacidadNinos: z.coerce.number().int().min(0).max(6),
  cama: z.string().trim().min(2),
  tamanoM2: z.coerce.number().int().min(0).optional(),
  vista: z.string().trim().optional().or(z.literal("")),
  ubicacionEnCasa: z.string().trim().optional().or(z.literal("")),
  banoPrivado: z.union([z.literal("on"), z.null()]).optional(),
  precioBase: z.coerce.number().int().min(10000),
  anticipoPct: z.coerce.number().int().min(0).max(100),
  estadiaMin: z.coerce.number().int().min(1).max(30),
  visible: z.union([z.literal("on"), z.null()]).optional(),
  ventaCerrada: z.union([z.literal("on"), z.null()]).optional(),
  seoTitulo: z.string().trim().optional().or(z.literal("")),
  seoDescripcion: z.string().trim().optional().or(z.literal("")),
  servicios: z.array(z.string()).default([]),
});

export async function guardarHabitacion(_prev: RoomState, formData: FormData): Promise<RoomState> {
  const user = await assertCan("habitaciones");
  const raw = {
    ...Object.fromEntries(formData),
    servicios: formData.getAll("servicios").map(String),
  };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los campos." };
  const d = parsed.data;
  const servicios = d.servicios.filter((s) => s in AMENIDADES);

  const before = await db.room.findUnique({ where: { id: d.id }, select: { nombre: true, precioBase: true } });
  await db.room.update({
    where: { id: d.id },
    data: {
      nombre: d.nombre,
      descripcionCorta: d.descripcionCorta,
      descripcionLarga: d.descripcionLarga,
      capacidadAdultos: d.capacidadAdultos,
      capacidadNinos: d.capacidadNinos,
      cama: d.cama,
      tamanoM2: d.tamanoM2 || null,
      vista: d.vista || null,
      ubicacionEnCasa: d.ubicacionEnCasa || null,
      banoPrivado: d.banoPrivado === "on",
      precioBase: d.precioBase,
      anticipoPct: d.anticipoPct,
      estadiaMin: d.estadiaMin,
      visible: d.visible === "on",
      ventaCerrada: d.ventaCerrada === "on",
      seoTitulo: d.seoTitulo || null,
      seoDescripcion: d.seoDescripcion || null,
      servicios,
    },
  });
  await logActivity({
    user,
    accion: "habitacion.editar",
    entidad: `Room:${d.nombre}`,
    valorAnterior: before ? `${before.precioBase}` : undefined,
    valorNuevo: `${d.precioBase}`,
  });
  revalidatePath("/admin/habitaciones");
  revalidatePath(`/habitaciones/${d.id}`);
  return { ok: true };
}

export async function moverHabitacion(formData: FormData) {
  const user = await assertCan("habitaciones");
  const id = String(formData.get("id"));
  const dir = String(formData.get("dir"));
  const rooms = await db.room.findMany({ orderBy: { orden: "asc" }, select: { id: true, orden: true } });
  const idx = rooms.findIndex((r) => r.id === id);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= rooms.length) return;
  await db.$transaction([
    db.room.update({ where: { id: rooms[idx].id }, data: { orden: rooms[swap].orden } }),
    db.room.update({ where: { id: rooms[swap].id }, data: { orden: rooms[idx].orden } }),
  ]);
  await logActivity({ user, accion: "habitacion.reordenar" });
  revalidatePath("/admin/habitaciones");
}

export async function toggleVisible(formData: FormData) {
  const user = await assertCan("habitaciones");
  const id = String(formData.get("id"));
  const room = await db.room.findUnique({ where: { id }, select: { visible: true, nombre: true } });
  if (!room) return;
  await db.room.update({ where: { id }, data: { visible: !room.visible } });
  await logActivity({ user, accion: "habitacion.visibilidad", entidad: `Room:${room.nombre}`, valorNuevo: String(!room.visible) });
  revalidatePath("/admin/habitaciones");
}

// ── Fotos ──────────────────────────────────────────────────────

export async function agregarFoto(formData: FormData) {
  const user = await assertCan("habitaciones");
  const roomId = String(formData.get("roomId"));
  const url = String(formData.get("url") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim();
  if (alt.length < 3) return; // el texto alternativo es obligatorio
  const count = await db.roomImage.count({ where: { roomId } });
  await db.roomImage.create({
    data: { roomId, url, alt, orden: count, portada: count === 0 },
  });
  await logActivity({ user, accion: "habitacion.foto-agregar", entidad: `Room:${roomId}` });
  revalidatePath(`/admin/habitaciones/${roomId}`);
}

export async function editarFoto(formData: FormData) {
  await assertCan("habitaciones");
  const id = String(formData.get("id"));
  const alt = String(formData.get("alt") ?? "").trim();
  const pie = String(formData.get("pie") ?? "").trim();
  const img = await db.roomImage.findUnique({ where: { id } });
  if (!img || alt.length < 3) return;
  await db.roomImage.update({ where: { id }, data: { alt, pie: pie || null } });
  revalidatePath(`/admin/habitaciones/${img.roomId}`);
}

export async function portadaFoto(formData: FormData) {
  await assertCan("habitaciones");
  const id = String(formData.get("id"));
  const img = await db.roomImage.findUnique({ where: { id } });
  if (!img) return;
  await db.$transaction([
    db.roomImage.updateMany({ where: { roomId: img.roomId }, data: { portada: false } }),
    db.roomImage.update({ where: { id }, data: { portada: true } }),
  ]);
  revalidatePath(`/admin/habitaciones/${img.roomId}`);
}

export async function moverFoto(formData: FormData) {
  await assertCan("habitaciones");
  const id = String(formData.get("id"));
  const dir = String(formData.get("dir"));
  const img = await db.roomImage.findUnique({ where: { id } });
  if (!img) return;
  const list = await db.roomImage.findMany({ where: { roomId: img.roomId }, orderBy: { orden: "asc" } });
  const idx = list.findIndex((x) => x.id === id);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= list.length) return;
  await db.$transaction([
    db.roomImage.update({ where: { id: list[idx].id }, data: { orden: list[swap].orden } }),
    db.roomImage.update({ where: { id: list[swap].id }, data: { orden: list[idx].orden } }),
  ]);
  revalidatePath(`/admin/habitaciones/${img.roomId}`);
}

export async function eliminarFoto(formData: FormData) {
  await assertCan("habitaciones");
  const id = String(formData.get("id"));
  const img = await db.roomImage.findUnique({ where: { id } });
  if (!img) return;
  await db.roomImage.delete({ where: { id } });
  revalidatePath(`/admin/habitaciones/${img.roomId}`);
}

export async function guardarReglas(formData: FormData) {
  const user = await assertCan("habitaciones");
  const roomId = String(formData.get("roomId"));
  const claves = formData.getAll("clave").map(String);
  const valores = formData.getAll("valor").map(String);
  const reglas = claves
    .map((k, i) => ({ clave: k.trim(), valor: (valores[i] ?? "").trim() }))
    .filter((r) => r.clave && r.valor);
  await db.room.update({ where: { id: roomId }, data: { reglas } });
  await logActivity({ user, accion: "habitacion.reglas", entidad: `Room:${roomId}` });
  revalidatePath(`/admin/habitaciones/${roomId}`);
}
