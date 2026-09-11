import "server-only";
import { db } from "@/lib/db";
import { addDays, toISODate, today } from "@/lib/dates";
import { takenNights } from "@/lib/booking/availability";

export type CalendarNight = {
  fecha: string;
  precio: number | null;
  estadiaMin: number;
  disponible: boolean;
  pasada: boolean;
};

/**
 * Calendario de una habitación para `meses` meses desde el mes actual.
 * Una noche ocupada nunca aparece como disponible.
 */
export async function roomCalendar(roomId: string, meses = 4): Promise<CalendarNight[]> {
  const t = today();
  const from = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1));
  const to = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + meses, 1));

  const [rows, taken] = await Promise.all([
    db.availability.findMany({
      where: { roomId, fecha: { gte: from, lt: to } },
      orderBy: { fecha: "asc" },
    }),
    takenNights(roomId, from, to),
  ]);

  const byDate = new Map(rows.map((r) => [toISODate(r.fecha), r]));
  const out: CalendarNight[] = [];
  for (let d = new Date(from); d < to; d = addDays(d, 1)) {
    const iso = toISODate(d);
    const row = byDate.get(iso);
    const pasada = d < t;
    out.push({
      fecha: iso,
      precio: row?.precio ?? null,
      estadiaMin: row?.estadiaMin ?? 1,
      disponible: !pasada && !!row && !row.cerrado && !taken.has(iso),
      pasada,
    });
  }
  return out;
}
