import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Serializa todas las operaciones que tocan la disponibilidad de una
 * habitación (crear retención, crear reserva, confirmar pago) mediante
 * un lock de transacción de PostgreSQL. Cualquier competidor por la
 * misma habitación espera hasta que esta transacción termine.
 */
export async function withRoomLock<T>(
  roomId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${roomId}))`;
      return fn(tx);
    },
    { timeout: 15_000 },
  );
}
