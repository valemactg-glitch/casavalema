import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const COOKIE = "valema_sid";

/** Id de sesión anónima, dueño de las retenciones de inventario. */
export async function getSessionId(): Promise<string> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? "";
}

/** Lee o crea el id de sesión (sólo en contextos que pueden escribir cookies). */
export async function ensureSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing;
  const sid = randomUUID();
  jar.set(COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return sid;
}
