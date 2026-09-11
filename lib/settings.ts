import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export type UbicacionSettings = {
  mapsUrl?: string;
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
  // Si el admin pegó un link de Google Maps, es la fuente más confiable: úsalo tal cual.
  if (u.mapsUrl) return u.mapsUrl;
  if (u.lat != null && u.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${u.lat},${u.lng}`;
  }
  if (u.direccionExacta) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(u.direccionExacta)}`;
  }
  return null;
}

/**
 * Intenta leer lat/lng de un link de Google Maps ya "expandido" (no un link
 * corto tipo maps.app.goo.gl). Cubre los formatos más comunes:
 *   .../@4.6097,-74.0817,17z
 *   .../place/.../@4.6097,-74.0817,17z/...!3d4.6097!4d-74.0817
 *   ?q=4.6097,-74.0817  |  ?ll=4.6097,-74.0817
 */
export function extractLatLngFromMapsUrl(url: string): { lat: number; lng: number } | null {
  const patrones = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // punto exacto del pin (el más preciso cuando existe)
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  ];
  for (const re of patrones) {
    const m = url.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }
  return null;
}

/** true si el link es uno de los formatos "cortos" que no traen coordenadas y hay que resolver primero. */
export function esMapsUrlCorto(url: string): boolean {
  return /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)\//i.test(url.trim());
}

/** URL del iframe embebido (no requiere API key de Google). */
export function googleMapsEmbedUrl(u: UbicacionSettings): string | null {
  if (u.lat != null && u.lng != null) {
    return `https://www.google.com/maps?q=${u.lat},${u.lng}&z=${u.zoom ?? 14}&output=embed`;
  }
  // Link de Google Maps ya expandido (trae coordenadas en la URL): úsalo para el mapa incrustado.
  if (u.mapsUrl) {
    const coords = extractLatLngFromMapsUrl(u.mapsUrl);
    if (coords) return `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=${u.zoom ?? 14}&output=embed`;
  }
  if (u.direccionAprox) {
    return `https://www.google.com/maps?q=${encodeURIComponent(u.direccionAprox)}&z=${u.zoom ?? 13}&output=embed`;
  }
  return null;
}
