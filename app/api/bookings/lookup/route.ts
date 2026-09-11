import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, bad } from "@/lib/http";

/** Portal del huésped sin cuenta: código + correo, o enlace firmado (gestionToken). */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const code = sp.get("code")?.trim().toUpperCase();
  const email = sp.get("email")?.trim().toLowerCase();
  const token = sp.get("token")?.trim();

  if (!token && (!code || !email)) {
    return bad("Necesitas el código y el correo de la reserva.");
  }

  const booking = await db.booking.findFirst({
    where: token
      ? { gestionToken: token }
      : { codigo: code, guest: { correo: email } },
    select: { gestionToken: true },
  });

  if (!booking) {
    return bad("No encontramos una reserva con esos datos.", 404);
  }

  return json({ ok: true, token: booking.gestionToken });
}
