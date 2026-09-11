import "server-only";
import { db } from "@/lib/db";

/** Código de reserva legible: VAL-26-0184 */
export async function generateBookingCode(): Promise<string> {
  const yy = String(new Date().getFullYear()).slice(2);
  for (let i = 0; i < 30; i++) {
    const n = String(Math.floor(1000 + Math.random() * 9000));
    const codigo = `VAL-${yy}-${n}`;
    const exists = await db.booking.findUnique({ where: { codigo }, select: { id: true } });
    if (!exists) return codigo;
  }
  throw new Error("No se pudo generar un código de reserva único");
}

/** Referencia de transacción de pago: PAY-VAL-26-0184-3F2A */
export function paymentReference(codigo: string): string {
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `PAY-${codigo}-${rand}`;
}
