import type { NextRequest } from "next/server";
import { json, bad } from "@/lib/http";
import { bookingInput } from "@/lib/validation";
import { ensureSessionId } from "@/lib/session";
import { createBooking } from "@/lib/booking/create";
import { notifyBooking } from "@/lib/email/send";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("Cuerpo inválido");
  }

  const parsed = bookingInput.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      fieldErrors[key] ??= issue.message;
    }
    return json({ ok: false, message: "Revisa los datos del formulario.", fieldErrors }, 400);
  }

  const sessionId = await ensureSessionId();
  const result = await createBooking(parsed.data, sessionId);

  if (!result.ok) {
    return json(
      { ok: false, message: result.message, reason: result.reason },
      result.code,
    );
  }

  await Promise.allSettled([
    notifyBooking(result.bookingId, "reserva_recibida"),
    notifyBooking(result.bookingId, "admin_nueva_reserva"),
  ]);

  return json({
    ok: true,
    codigo: result.codigo,
    bookingId: result.bookingId,
    gestionToken: result.gestionToken,
    total: result.total,
    anticipo: result.anticipo,
    saldo: result.saldo,
  });
}
