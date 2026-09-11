import { NextResponse } from "next/server";
import { destroySession, getCurrentUser, logActivity } from "@/lib/auth/session";

async function handle(req: Request) {
  const user = await getCurrentUser();
  if (user) await logActivity({ user, accion: "sesion.cerrar" });
  await destroySession();
  return NextResponse.redirect(new URL("/admin/login", req.url));
}

export const GET = handle;
export const POST = handle;
