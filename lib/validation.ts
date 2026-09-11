import { z } from "zod";
import { DOC_TIPOS } from "@/lib/catalog";

const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (yyyy-mm-dd).");

export const holdInput = z.object({
  habitacion: z.string().min(1),
  llegada: iso,
  salida: iso,
  adultos: z.coerce.number().int().min(1).max(8),
  ninos: z.coerce.number().int().min(0).max(6),
});
export type HoldInput = z.infer<typeof holdInput>;

export const guestInput = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre."),
  apellidos: z.string().trim().min(2, "Escribe tus apellidos."),
  docTipo: z.enum(DOC_TIPOS.map((d) => d.value) as [string, ...string[]]),
  docNumero: z
    .string()
    .trim()
    .min(4, "Escribe el número completo.")
    .regex(/^[0-9A-Za-z-]+$/, "Escribe el número completo, sin puntos ni espacios."),
  pais: z.string().trim().min(2),
  ciudad: z.string().trim().optional().or(z.literal("")),
  telefono: z.string().trim().min(7, "Escribe un teléfono válido."),
  correo: z.string().trim().email("Escribe un correo válido."),
});

export const companionInput = z.object({
  nombre: z.string().trim().min(2),
  docNumero: z.string().trim().optional().or(z.literal("")),
  esMenor: z.boolean().optional(),
  edad: z.coerce.number().int().min(0).max(17).optional(),
});

export const bookingInput = z.object({
  habitacion: z.string().min(1),
  llegada: iso,
  salida: iso,
  adultos: z.coerce.number().int().min(1).max(8),
  ninos: z.coerce.number().int().min(0).max(6),
  planId: z.string().min(1),
  servicios: z
    .array(z.object({ serviceId: z.string(), cantidad: z.coerce.number().int().min(1).max(20) }))
    .max(20)
    .default([]),
  guest: guestInput,
  companions: z.array(companionInput).max(10).default([]),
  horaLlegada: z.string().trim().max(20).optional().or(z.literal("")),
  solicitudes: z.string().trim().max(1000).optional().or(z.literal("")),
  reservaParaOtro: z.boolean().optional().default(false),
  facturacion: z
    .object({
      razonSocial: z.string().trim().max(160),
      nit: z.string().trim().max(40),
      direccion: z.string().trim().max(200).optional().or(z.literal("")),
    })
    .optional(),
  consentimientos: z.object({
    politicas: z.literal(true, { message: "Debes aceptar las políticas para reservar." }),
    datos: z.literal(true, { message: "Necesitamos tu autorización para tratar tus datos." }),
    comunicaciones: z.boolean().optional().default(false),
  }),
  codigoPromocional: z.string().trim().max(40).optional().or(z.literal("")),
});
export type BookingInput = z.infer<typeof bookingInput>;

export const paymentInput = z.object({
  metodo: z.enum(["TARJETA", "PSE", "TRANSFERENCIA"]),
  modalidad: z.enum(["anticipo", "total"]),
});
