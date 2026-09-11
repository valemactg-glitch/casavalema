export const ESTADO_LABEL: Record<string, { label: string; tone: "exito" | "aviso" | "pendiente" | "error" | "info" | "neutro" }> = {
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

export const CANAL_LABEL: Record<string, string> = {
  DIRECTO: "Directo",
  AIRBNB: "Airbnb",
  WHATSAPP: "WhatsApp",
  TELEFONO: "Teléfono",
};

export const PAGO_LABEL: Record<string, { label: string; tone: "exito" | "pendiente" | "error" | "neutro" }> = {
  PENDIENTE: { label: "Pendiente", tone: "pendiente" },
  APROBADO: { label: "Aprobado", tone: "exito" },
  RECHAZADO: { label: "Rechazado", tone: "error" },
  CANCELADO: { label: "Cancelado", tone: "neutro" },
  EXPIRADO: { label: "Expirado", tone: "error" },
  REEMBOLSADO: { label: "Reembolsado", tone: "neutro" },
};
