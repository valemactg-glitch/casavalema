"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertCan, logActivity } from "@/lib/auth/session";
import { parseISODate, eachNight } from "@/lib/dates";

const bulkSchema = z.object({
  rooms: z.array(z.string()).min(1),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dias: z.array(z.coerce.number().int().min(0).max(6)).default([]),
  precio: z.coerce.number().int().min(0).optional(),
  estadiaMin: z.coerce.number().int().min(1).max(30).optional(),
  cerrado: z.enum(["", "abrir", "cerrar"]).optional(),
});

export type BulkState = { ok?: number; error?: string };

export async function editarMasivo(_prev: BulkState, formData: FormData): Promise<BulkState> {
  const user = await assertCan("tarifas");
  const parsed = bulkSchema.safeParse({
    rooms: formData.getAll("rooms").map(String),
    desde: formData.get("desde"),
    hasta: formData.get("hasta"),
    dias: formData.getAll("dias").map(String),
    precio: formData.get("precio") || undefined,
    estadiaMin: formData.get("estadiaMin") || undefined,
    cerrado: formData.get("cerrado") || "",
  });
  if (!parsed.success) return { error: "Elige al menos una habitación y un rango de fechas." };
  const d = parsed.data;
  const desde = parseISODate(d.desde)!;
  const hasta = parseISODate(d.hasta)!;
  if (hasta < desde) return { error: "La fecha final debe ser posterior o igual a la inicial." };
  if (d.precio == null && d.estadiaMin == null && !d.cerrado) {
    return { error: "Indica al menos un cambio (precio, estadía mínima o inventario)." };
  }

  const noches = eachNight(desde, hasta).concat([hasta]).filter((n) => {
    if (d.dias.length === 0) return true;
    return d.dias.includes(n.getUTCDay());
  });

  const data: Record<string, unknown> = {};
  if (d.precio != null) data.precio = d.precio;
  if (d.estadiaMin != null) data.estadiaMin = d.estadiaMin;
  if (d.cerrado === "cerrar") data.cerrado = true;
  if (d.cerrado === "abrir") data.cerrado = false;

  let count = 0;
  for (const roomId of d.rooms) {
    const r = await db.availability.updateMany({
      where: { roomId, fecha: { in: noches } },
      data: data as never,
    });
    count += r.count;
  }
  await logActivity({
    user,
    accion: "tarifa.editar-masivo",
    detalle: `${d.rooms.length} habitación(es) · ${d.desde}–${d.hasta} · ${count} noches`,
    valorNuevo: JSON.stringify(data),
  });
  revalidatePath("/admin/tarifas");
  return { ok: count };
}

export async function crearTemporada(formData: FormData) {
  const user = await assertCan("tarifas");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const desde = parseISODate(String(formData.get("desde")));
  const hasta = parseISODate(String(formData.get("hasta")));
  const ajustePct = Number(formData.get("ajustePct"));
  if (!nombre || !desde || !hasta || !Number.isFinite(ajustePct)) return;
  await db.season.create({ data: { nombre, desde, hasta, ajustePct } });
  await logActivity({ user, accion: "temporada.crear", detalle: nombre });
  revalidatePath("/admin/tarifas");
}

export async function toggleTemporada(formData: FormData) {
  await assertCan("tarifas");
  const id = String(formData.get("id"));
  const s = await db.season.findUnique({ where: { id } });
  if (s) await db.season.update({ where: { id }, data: { activa: !s.activa } });
  revalidatePath("/admin/tarifas");
}

export async function crearPromo(formData: FormData) {
  const user = await assertCan("tarifas");
  const codigo = String(formData.get("codigo") ?? "").trim().toUpperCase();
  const tipo = String(formData.get("tipo") ?? "PORCENTAJE");
  const valor = Number(formData.get("valor"));
  const minNoches = Number(formData.get("minNoches")) || 1;
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  if (!codigo || !Number.isFinite(valor) || valor <= 0) return;
  await db.promoCode.upsert({
    where: { codigo },
    create: { codigo, tipo: tipo as never, valor, minNoches, descripcion },
    update: { tipo: tipo as never, valor, minNoches, descripcion, activo: true },
  });
  await logActivity({ user, accion: "promo.crear", detalle: codigo });
  revalidatePath("/admin/tarifas");
}

export async function togglePromo(formData: FormData) {
  await assertCan("tarifas");
  const id = String(formData.get("id"));
  const p = await db.promoCode.findUnique({ where: { id } });
  if (p) await db.promoCode.update({ where: { id }, data: { activo: !p.activo } });
  revalidatePath("/admin/tarifas");
}
