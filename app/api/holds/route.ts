import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, bad } from "@/lib/http";
import { holdInput } from "@/lib/validation";
import { parseISODate, today } from "@/lib/dates";
import { ensureSessionId } from "@/lib/session";
import { createOrRenewHold, HOLD_TTL_MIN } from "@/lib/booking/hold";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("Cuerpo inválido");
  }

  const parsed = holdInput.safeParse(body);
  if (!parsed.success) {
    return bad("Datos incompletos", 400, { issues: parsed.error.issues });
  }

  const llegada = parseISODate(parsed.data.llegada);
  const salida = parseISODate(parsed.data.salida);
  if (!llegada || !salida || salida <= llegada) return bad("La salida debe ser posterior a la llegada.");
  if (llegada < today()) return bad("La llegada no puede ser una fecha pasada.");

  const room = await db.room.findFirst({
    where: { slug: parsed.data.habitacion, visible: true },
    select: { id: true },
  });
  if (!room) return bad("Habitación no encontrada", 404);

  const sessionId = await ensureSessionId();
  const result = await createOrRenewHold({
    roomId: room.id,
    llegada,
    salida,
    adultos: parsed.data.adultos,
    ninos: parsed.data.ninos,
    sessionId,
  });

  if (!result.ok) {
    return json({ ok: false, message: result.message, reason: result.reason }, 409);
  }

  return json({
    ok: true,
    holdId: result.holdId,
    expiraEn: result.expiraEn.toISOString(),
    ttlMinutos: HOLD_TTL_MIN,
  });
}

export async function DELETE(req: NextRequest) {
  const holdId = req.nextUrl.searchParams.get("id");
  if (!holdId) return bad("Falta el id");
  const { getSessionId } = await import("@/lib/session");
  const sessionId = await getSessionId();
  await db.bookingHold.deleteMany({ where: { id: holdId, sessionId, bookingId: null } });
  return json({ ok: true });
}
