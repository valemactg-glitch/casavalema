"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, logActivity } from "@/lib/auth/session";

const MAX_INTENTOS = 5;
const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type LoginState = {
  error?: string;
  intentosRestantes?: number;
};

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Escribe un correo y una contraseña válidos." };
  }
  const volver = String(formData.get("volver") ?? "");

  const jar = await cookies();
  const key = "valema_login_try";
  const previos = Number(jar.get(key)?.value ?? "0");
  if (previos >= MAX_INTENTOS) {
    return { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  const ok = user && user.activo && verifyPassword(parsed.data.password, user.passwordHash);

  if (!ok) {
    const intentos = previos + 1;
    jar.set(key, String(intentos), { httpOnly: true, maxAge: 600, path: "/" });
    return {
      error: user && !user.activo ? "Este usuario está desactivado." : "Correo o contraseña incorrectos.",
      intentosRestantes: Math.max(0, MAX_INTENTOS - intentos),
    };
  }

  jar.delete(key);
  await db.user.update({ where: { id: user.id }, data: { ultimoAcceso: new Date() } });
  await createSession(user.id);
  await logActivity({
    user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol as never },
    accion: "sesion.iniciar",
  });

  const destino = volver.startsWith("/admin") ? volver : "/admin";
  redirect(destino);
}
