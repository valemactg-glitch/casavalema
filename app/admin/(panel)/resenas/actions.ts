"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan, logActivity } from "@/lib/auth/session";

async function setReview(id: string, data: Record<string, unknown>, accion: string) {
  const user = await assertCan("resenas");
  const r = await db.review.findUnique({ where: { id } });
  if (!r) return;
  // Sin reserva asociada no se puede publicar.
  if (data.estado === "PUBLICADA" && !r.bookingId) {
    await db.review.update({ where: { id }, data: { estado: "SIN_VALIDAR" } });
    await logActivity({ user, accion: "resena.sin-validar", entidad: `Review:${id}` });
    revalidatePath("/admin/resenas");
    return;
  }
  await db.review.update({ where: { id }, data });
  await logActivity({ user, accion, entidad: `Review:${id}` });
  revalidatePath("/admin/resenas");
  revalidatePath("/resenas");
}

export async function aprobarResena(fd: FormData) {
  await setReview(String(fd.get("id")), { estado: "PUBLICADA" }, "resena.aprobar");
}
export async function rechazarResena(fd: FormData) {
  await setReview(String(fd.get("id")), { estado: "RECHAZADA" }, "resena.rechazar");
}
export async function ocultarResena(fd: FormData) {
  await setReview(String(fd.get("id")), { estado: "PENDIENTE" }, "resena.ocultar");
}
export async function destacarResena(fd: FormData) {
  const id = String(fd.get("id"));
  const r = await db.review.findUnique({ where: { id } });
  if (r) await setReview(id, { destacada: !r.destacada }, "resena.destacar");
}
export async function responderResena(fd: FormData) {
  const id = String(fd.get("id"));
  const respuesta = String(fd.get("respuesta") ?? "").trim() || null;
  await setReview(id, { respuesta }, "resena.responder");
}
