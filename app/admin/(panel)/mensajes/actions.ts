"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan, logActivity } from "@/lib/auth/session";

export async function marcarGestionado(formData: FormData) {
  await assertCan("mensajes");
  const id = String(formData.get("id"));
  const m = await db.contactMessage.findUnique({ where: { id } });
  if (m) await db.contactMessage.update({ where: { id }, data: { gestionado: !m.gestionado } });
  revalidatePath("/admin/mensajes");
}

export async function guardarPlantilla(formData: FormData) {
  const user = await assertCan("mensajes");
  const evento = String(formData.get("evento"));
  const asunto = String(formData.get("asunto") ?? "").trim();
  const cuerpo = String(formData.get("cuerpo") ?? "").trim();
  const activa = formData.get("activa") === "on";
  if (!evento || !asunto) return;
  await db.emailTemplate.upsert({
    where: { evento },
    create: { evento, asunto, cuerpo, activa },
    update: { asunto, cuerpo, activa },
  });
  await logActivity({ user, accion: "plantilla.editar", detalle: evento });
  revalidatePath("/admin/mensajes");
}
