import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { can, type Modulo, type Rol } from "@/lib/auth/rbac";

const COOKIE = "valema_admin";
const TTL_MS = 1000 * 60 * 60 * 12; // 12 h

export type AdminUser = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
};

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const h = await headers();
  await db.adminSession.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + TTL_MS),
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
    },
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.adminSession.deleteMany({ where: { token } });
  jar.delete(COOKIE);
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.adminSession.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || !session.user.activo) {
    return null;
  }
  return {
    id: session.user.id,
    nombre: session.user.nombre,
    email: session.user.email,
    rol: session.user.rol as Rol,
  };
}

/** Exige sesión + (opcional) permiso sobre un módulo. Redirige si falla. */
export async function requireUser(modulo?: Modulo, accion: "read" | "write" = "read"): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (modulo && !can(user.rol, modulo, accion)) redirect("/admin/sin-permiso");
  return user;
}

/** Para server actions: lanza en vez de redirigir. */
export async function assertCan(modulo: Modulo, accion: "read" | "write" = "write"): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");
  if (!can(user.rol, modulo, accion)) throw new Error("Permiso insuficiente");
  return user;
}

export async function logActivity(params: {
  user: AdminUser | null;
  accion: string;
  entidad?: string;
  detalle?: string;
  valorAnterior?: string;
  valorNuevo?: string;
}): Promise<void> {
  await db.activityLog.create({
    data: {
      userId: params.user?.id ?? null,
      actorNombre: params.user?.nombre ?? "sistema",
      accion: params.accion,
      entidad: params.entidad ?? null,
      detalle: params.detalle ?? null,
      valorAnterior: params.valorAnterior ?? null,
      valorNuevo: params.valorNuevo ?? null,
    },
  });
}
