"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan, logActivity } from "@/lib/auth/session";

export async function guardarHuesped(formData: FormData) {
  const user = await assertCan("huespedes");
  const id = String(formData.get("id"));
  const notasPrivadas = String(formData.get("notasPrivadas") ?? "").trim() || null;
  const preferencias = String(formData.get("preferencias") ?? "").trim() || null;
  const etiquetas = String(formData.get("etiquetas") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  await db.guest.update({ where: { id }, data: { notasPrivadas, preferencias, etiquetas } });
  await logActivity({ user, accion: "huesped.editar", entidad: `Guest:${id}` });
  revalidatePath(`/admin/huespedes/${id}`);
}

export async function marcarEliminacion(formData: FormData) {
  const user = await assertCan("huespedes");
  const id = String(formData.get("id"));
  const g = await db.guest.findUnique({ where: { id } });
  if (!g) return;
  await db.guest.update({ where: { id }, data: { solicitudEliminacion: !g.solicitudEliminacion } });
  await logActivity({ user, accion: "huesped.solicitud-eliminacion", entidad: `Guest:${id}`, valorNuevo: String(!g.solicitudEliminacion) });
  revalidatePath(`/admin/huespedes/${id}`);
}
