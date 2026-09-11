"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan, logActivity } from "@/lib/auth/session";
import { extractLatLngFromMapsUrl, esMapsUrlCorto } from "@/lib/settings";

/** Guarda un grupo de ajustes (merge sobre Setting.data). */
export async function guardarConfig(formData: FormData) {
  const user = await assertCan("configuracion");
  const grupo = String(formData.get("__grupo"));
  const NUMERIC = new Set(["capacidadTotal", "lat", "lng", "zoom", "frecuenciaSyncHoras"]);
  const BOOLEAN = new Set(["mostrarDireccionAntesDeReservar"]);
  const patch: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("__") || k.startsWith("$")) continue; // "$ACTION_ID_…" es interno de Next
    const val = String(v).trim();
    if (BOOLEAN.has(k)) {
      patch[k] = val === "on"; // el checkbox va después de un input oculto "off": gana el último valor
    } else if (k.endsWith("Pct") || NUMERIC.has(k)) {
      patch[k] = val === "" ? undefined : Number(val);
    } else {
      patch[k] = val;
    }
  }

  // Si pegaron un link de Google Maps y no llenaron lat/lng a mano, intenta
  // sacar las coordenadas del link para que el mapa incrustado también sirva.
  if (grupo === "ubicacion" && typeof patch.mapsUrl === "string" && patch.mapsUrl && patch.lat == null && patch.lng == null) {
    let url = patch.mapsUrl;
    if (esMapsUrlCorto(url)) {
      try {
        const res = await fetch(url, { redirect: "follow" });
        url = res.url || url;
      } catch {
        // sin internet o Google bloqueó la petición: seguimos solo con el link tal cual.
      }
    }
    const coords = extractLatLngFromMapsUrl(url);
    if (coords) {
      patch.lat = coords.lat;
      patch.lng = coords.lng;
    }
  }

  const setting = (await db.setting.findUnique({ where: { id: 1 } })) ?? (await db.setting.create({ data: { id: 1 } }));
  const data = (setting.data as Record<string, Record<string, unknown>>) ?? {};
  data[grupo] = { ...(data[grupo] ?? {}), ...patch };
  await db.setting.update({ where: { id: 1 }, data: { data: data as never } });
  await logActivity({ user, accion: "config.guardar", detalle: grupo });
  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
}
