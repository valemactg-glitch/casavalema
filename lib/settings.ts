import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export type UbicacionSettings = {
  lat?: number;
  lng?: number;
  zoom?: number;
  direccionAprox?: string;
  direccionExacta?: string;
  comoLlegar?: string;
};

export type SettingsData = {
  alojamiento?: Record<string, unknown>;
  pagos?: Record<string, unknown>;
  integraciones?: Record<string, unknown>;
  contacto?: Record<string, unknown>;
  legal?: Record<string, unknown>;
  privacidad?: Record<string, unknown>;
  ubicacion?: UbicacionSettings;
};

export const getSettings = cache(async (): Promise<SettingsData> => {
  const row = await db.setting.findUnique({ where: { id: 1 } });
  return (row?.data as SettingsData) ?? {};
});

/** URL de Google Maps para abrir la ruta (sin necesitar API key). */
export function googleMapsUrl(u: UbicacionSettings): string | null {
  if (u.lat != null && u.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${u.lat},${u.lng}`;
  }
  if (u.direccionExacta) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(u.direccionExacta)}`;
  }
  return null;
}

/** URL del iframe embebido (no requiere API key de Google). */
export function googleMapsEmbedUrl(u: UbicacionSettings): string | null {
  if (u.lat != null && u.lng != null) {
    return `https://www.google.com/maps?q=${u.lat},${u.lng}&z=${u.zoom ?? 14}&output=embed`;
  }
  if (u.direccionAprox) {
    return `https://www.google.com/maps?q=${encodeURIComponent(u.direccionAprox)}&z=${u.zoom ?? 13}&output=embed`;
  }
  return null;
}
