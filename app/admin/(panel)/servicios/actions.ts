"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan, logActivity } from "@/lib/auth/session";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

export async function guardarServicio(formData: FormData) {
  const user = await assertCan("servicios");
  const id = String(formData.get("id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const precio = Number(formData.get("precio")) || 0;
  const tipoCobro = String(formData.get("tipoCobro") ?? "UNA_VEZ");
  const disponibilidad = String(formData.get("disponibilidad") ?? "ADICIONAL");
  const cupo = formData.get("cupo") ? Number(formData.get("cupo")) : null;
  const anticipacionHoras = Number(formData.get("anticipacionHoras")) || 0;
  const activo = formData.get("activo") === "on";
  if (nombre.length < 2 || descripcion.length < 5) return;

  const data = {
    nombre,
    descripcion,
    precio,
    tipoCobro: tipoCobro as never,
    disponibilidad: disponibilidad as never,
    cupo,
    anticipacionHoras,
    activo,
  };

  if (id) {
    await db.service.update({ where: { id }, data });
  } else {
    const orden = await db.service.count();
    await db.service.create({ data: { ...data, slug: slugify(nombre) + "-" + Math.random().toString(36).slice(2, 5), orden } });
  }
  await logActivity({ user, accion: id ? "servicio.editar" : "servicio.crear", detalle: nombre });
  revalidatePath("/admin/servicios");
  revalidatePath("/servicios");
}
