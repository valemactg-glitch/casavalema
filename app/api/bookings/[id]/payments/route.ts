import type { NextRequest } from "next/server";
import { json, bad } from "@/lib/http";
import { paymentInput } from "@/lib/validation";
import { startPayment } from "@/lib/booking/payments";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/bookings/[id]/payments">) {
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("Cuerpo inválido");
  }
  const parsed = paymentInput.safeParse(body);
  if (!parsed.success) return bad("Datos de pago incompletos");

  const result = await startPayment({
    bookingId: id,
    metodo: parsed.data.metodo,
    modalidad: parsed.data.modalidad,
  });

  if (!result.ok) return json({ ok: false, message: result.message }, result.code);

  return json({
    ok: true,
    estado: result.estado,
    bookingEstado: result.bookingEstado,
    codigo: result.codigo,
    referencia: result.referencia,
    redirectUrl: result.redirectUrl,
  });
}
