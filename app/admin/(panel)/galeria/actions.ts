"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan, logActivity } from "@/lib/auth/session";

export async function agregarImagen(formData: FormData) {
  const user = await assertCan("galeria");
  const url = String(formData.get("url") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "comunes");
  const pie = String(formData.get("pie") ?? "").trim() || null;
  if (alt.length < 3) return; // texto alternativo obligatorio
  const orden = await db.galleryImage.count({ where: { categoria } });
  await db.galleryImage.create({ data: { url, alt, categoria, pie, orden } });
  await logActivity({ user, accion: "galeria.agregar" });
  revalidatePath("/admin/galeria");
  revalidatePath("/galeria");
}

export async function editarImagen(formData: FormData) {
  await assertCan("galeria");
  const id = String(formData.get("id"));
  const alt = String(formData.get("alt") ?? "").trim();
  const pie = String(formData.get("pie") ?? "").trim() || null;
  const categoria = String(formData.get("categoria") ?? "comunes");
  if (alt.length < 3) return;
  await db.galleryImage.update({ where: { id }, data: { alt, pie, categoria } });
  revalidatePath("/admin/galeria");
  revalidatePath("/galeria");
}

export async function togglePublicada(formData: FormData) {
  await assertCan("galeria");
  const id = String(formData.get("id"));
  const img = await db.galleryImage.findUnique({ where: { id } });
  if (img) await db.galleryImage.update({ where: { id }, data: { publicada: !img.publicada } });
  revalidatePath("/admin/galeria");
  revalidatePath("/galeria");
}

export async function eliminarImagen(formData: FormData) {
  await assertCan("galeria");
  await db.galleryImage.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/galeria");
  revalidatePath("/galeria");
}
