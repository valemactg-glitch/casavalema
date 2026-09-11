"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertCan, logActivity } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

const ROLES = ["PROPIETARIO", "ADMINISTRADOR", "RECEPCION", "CONTABILIDAD", "EDITOR", "SOLO_LECTURA"] as const;

const schema = z.object({
  email: z.string().trim().email(),
  nombre: z.string().trim().min(2),
  rol: z.enum(ROLES),
  password: z.string().min(8, "Mínimo 8 caracteres.").optional().or(z.literal("")),
});

export type UsuarioState = { ok?: boolean; error?: string };

export async function crearUsuario(_prev: UsuarioState, formData: FormData): Promise<UsuarioState> {
  const actor = await assertCan("usuarios");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  if (!parsed.data.password) return { error: "Escribe una contraseña inicial." };

  const existe = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existe) return { error: "Ya existe un usuario con ese correo." };

  await db.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      nombre: parsed.data.nombre,
      rol: parsed.data.rol,
      passwordHash: hashPassword(parsed.data.password),
    },
  });
  await logActivity({ user: actor, accion: "usuario.crear", detalle: parsed.data.email });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function cambiarRol(formData: FormData) {
  const actor = await assertCan("usuarios");
  const id = String(formData.get("id"));
  const rol = String(formData.get("rol"));
  if (!ROLES.includes(rol as never)) return;
  const u = await db.user.findUnique({ where: { id } });
  if (!u) return;
  await db.user.update({ where: { id }, data: { rol: rol as never } });
  await logActivity({ user: actor, accion: "usuario.rol", entidad: `User:${u.email}`, valorAnterior: u.rol, valorNuevo: rol });
  revalidatePath("/admin/usuarios");
}

export async function toggleUsuario(formData: FormData) {
  const actor = await assertCan("usuarios");
  const id = String(formData.get("id"));
  const u = await db.user.findUnique({ where: { id } });
  if (!u) return;
  await db.$transaction([
    db.user.update({ where: { id }, data: { activo: !u.activo } }),
    ...(u.activo ? [db.adminSession.deleteMany({ where: { userId: id } })] : []),
  ]);
  await logActivity({ user: actor, accion: "usuario.estado", entidad: `User:${u.email}`, valorNuevo: String(!u.activo) });
  revalidatePath("/admin/usuarios");
}

export async function restablecerClave(formData: FormData) {
  const actor = await assertCan("usuarios");
  const id = String(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return;
  const u = await db.user.findUnique({ where: { id } });
  if (!u) return;
  await db.$transaction([
    db.user.update({ where: { id }, data: { passwordHash: hashPassword(password) } }),
    db.adminSession.deleteMany({ where: { userId: id } }),
  ]);
  await logActivity({ user: actor, accion: "usuario.clave", entidad: `User:${u.email}` });
  revalidatePath("/admin/usuarios");
}
