"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { MOTIVOS_CONTACTO } from "@/lib/catalog";

const schema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre."),
  correo: z.string().trim().email("Escribe un correo válido."),
  telefono: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => v || undefined),
  motivo: z.string().refine((v) => MOTIVOS_CONTACTO.includes(v), "Elige un motivo."),
  mensaje: z.string().trim().min(10, "Cuéntanos un poco más (mínimo 10 caracteres)."),
  consentimiento: z.literal("on", { message: "Necesitamos tu autorización para responderte." }),
});

export type ContactState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function enviarContacto(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = schema.safeParse({
    nombre: formData.get("nombre"),
    correo: formData.get("correo"),
    telefono: formData.get("telefono"),
    motivo: formData.get("motivo"),
    mensaje: formData.get("mensaje"),
    consentimiento: formData.get("consentimiento"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors };
  }

  try {
    await db.contactMessage.create({
      data: {
        nombre: parsed.data.nombre,
        correo: parsed.data.correo,
        telefono: parsed.data.telefono ?? null,
        motivo: parsed.data.motivo,
        mensaje: parsed.data.mensaje,
        consentimiento: true,
      },
    });
    return { ok: true };
  } catch (err) {
    console.error("enviarContacto", err);
    return { ok: false, error: "No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos por WhatsApp." };
  }
}
