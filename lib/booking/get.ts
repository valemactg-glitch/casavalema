import "server-only";
import { db } from "@/lib/db";

const include = {
  room: { include: { images: { orderBy: { orden: "asc" as const } } } },
  guest: true,
  ratePlan: true,
  services: { include: { service: true } },
  companions: true,
  review: true,
  payments: { orderBy: { createdAt: "asc" as const } },
  changeRequests: { orderBy: { createdAt: "desc" as const } },
  events: { orderBy: { createdAt: "desc" as const } },
} as const;

export type FullBooking = NonNullable<Awaited<ReturnType<typeof getBookingByToken>>>;

export async function getBookingByToken(token: string) {
  if (!token) return null;
  return db.booking.findUnique({ where: { gestionToken: token }, include });
}

export async function getBookingByCode(code: string) {
  if (!code) return null;
  return db.booking.findUnique({ where: { codigo: code.toUpperCase() }, include });
}

export function paidTotal(payments: { estado: string; valor: number }[]): number {
  return payments.filter((p) => p.estado === "APROBADO").reduce((s, p) => s + p.valor, 0);
}

export const ESTADO_BOOKING: Record<string, { label: string; tone: "exito" | "pendiente" | "info" | "error" | "neutro" }> = {
  BORRADOR: { label: "Borrador", tone: "neutro" },
  PENDIENTE_PAGO: { label: "Pendiente de pago", tone: "pendiente" },
  PAGO_PARCIAL: { label: "Pago parcial", tone: "info" },
  CONFIRMADA: { label: "Confirmada", tone: "exito" },
  EN_CURSO: { label: "En curso", tone: "info" },
  COMPLETADA: { label: "Completada", tone: "neutro" },
  CANCELADA: { label: "Cancelada", tone: "error" },
  NO_SHOW: { label: "No-show", tone: "error" },
  REEMBOLSADA: { label: "Reembolsada", tone: "neutro" },
  REEMBOLSO_PARCIAL: { label: "Reembolso parcial", tone: "neutro" },
};

export const ESTADO_PAGO: Record<string, { label: string; tone: "exito" | "pendiente" | "error" | "neutro" }> = {
  PENDIENTE: { label: "Pendiente de verificación", tone: "pendiente" },
  APROBADO: { label: "Aprobado", tone: "exito" },
  RECHAZADO: { label: "Rechazado", tone: "error" },
  CANCELADO: { label: "Cancelado", tone: "neutro" },
  EXPIRADO: { label: "Expirado", tone: "error" },
  REEMBOLSADO: { label: "Reembolsado", tone: "neutro" },
};
