"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan, logActivity } from "@/lib/auth/session";

export async function guardarPagina(formData: FormData) {
  const user = await assertCan("contenido");
  const clave = String(formData.get("clave"));
  const raw = String(formData.get("contenido") ?? "{}");
  let contenido: unknown;
  try {
    contenido = JSON.parse(raw);
  } catch {
    return; // JSON inválido: no guardar
  }
  await db.sitePage.update({ where: { clave }, data: { contenido: contenido as never } });
  await logActivity({ user, accion: "contenido.pagina", detalle: clave });
  revalidatePath("/", "layout");
  revalidatePath("/admin/contenido");
}

export async function guardarLegal(formData: FormData) {
  const user = await assertCan("contenido");
  const slug = String(formData.get("slug"));
  const cuerpo = String(formData.get("cuerpo") ?? "").trim();
  const version = String(formData.get("version") ?? "1.0").trim();
  await db.legalDoc.update({ where: { slug }, data: { cuerpo, version } });
  await logActivity({ user, accion: "contenido.legal", detalle: slug });
  revalidatePath(`/legales/${slug}`);
  revalidatePath("/admin/contenido");
}

export async function guardarFaq(formData: FormData) {
  const user = await assertCan("contenido");
  const id = String(formData.get("id") ?? "");
  const categoria = String(formData.get("categoria") ?? "").trim();
  const pregunta = String(formData.get("pregunta") ?? "").trim();
  const respuesta = String(formData.get("respuesta") ?? "").trim();
  const publicada = formData.get("publicada") === "on";
  if (!categoria || !pregunta || !respuesta) return;
  if (id) {
    await db.faqItem.update({ where: { id }, data: { categoria, pregunta, respuesta, publicada } });
  } else {
    const orden = await db.faqItem.count();
    await db.faqItem.create({ data: { categoria, pregunta, respuesta, publicada, orden } });
  }
  await logActivity({ user, accion: "contenido.faq" });
  revalidatePath("/preguntas-frecuentes");
  revalidatePath("/admin/contenido");
}

export async function eliminarFaq(formData: FormData) {
  await assertCan("contenido");
  await db.faqItem.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/preguntas-frecuentes");
  revalidatePath("/admin/contenido");
}
