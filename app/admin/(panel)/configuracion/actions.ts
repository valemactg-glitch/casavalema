"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan, logActivity } from "@/lib/auth/session";

/** Guarda un grupo de ajustes (merge sobre Setting.data). */
export async function guardarConfig(formData: FormData) {
  const user = await assertCan("configuracion");
  const grupo = String(formData.get("__grupo"));
  const patch: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("__")) continue;
    const val = String(v).trim();
    patch[k] = k.endsWith("Pct") || k === "capacidadTotal" ? Number(val) || 0 : k === "mostrarDireccionAntesDeReservar" ? val === "on" : val;
  }

  const setting = (await db.setting.findUnique({ where: { id: 1 } })) ?? (await db.setting.create({ data: { id: 1 } }));
  const data = (setting.data as Record<string, Record<string, unknown>>) ?? {};
  data[grupo] = { ...(data[grupo] ?? {}), ...patch };
  await db.setting.update({ where: { id: 1 }, data: { data: data as never } });
  await logActivity({ user, accion: "config.guardar", detalle: grupo });
  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
}
