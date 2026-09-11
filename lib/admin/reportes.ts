import "server-only";
import { db } from "@/lib/db";
import { addDays } from "@/lib/dates";

export async function reportes(desde: Date, hasta: Date) {
  const [bookings, payments, rooms, reviews] = await Promise.all([
    db.booking.findMany({
      where: { llegada: { gte: desde, lt: hasta } },
      include: { room: { select: { nombre: true } } },
    }),
    db.payment.findMany({
      where: { estado: "APROBADO", createdAt: { gte: desde, lt: hasta } },
      select: { valor: true, comision: true, createdAt: true },
    }),
    db.room.findMany({ where: { visible: true }, select: { id: true, nombre: true } }),
    db.review.findMany({ where: { estado: "PUBLICADA", createdAt: { gte: desde, lt: hasta } } }),
  ]);

  const activas = bookings.filter((b) => !["CANCELADA", "BORRADOR", "NO_SHOW"].includes(b.estado));
  const dias = Math.max(1, Math.round((hasta.getTime() - desde.getTime()) / 86_400_000));

  const ingresos = payments.filter((p) => p.valor > 0).reduce((s, p) => s + p.valor, 0);
  const reembolsos = payments.filter((p) => p.valor < 0).reduce((s, p) => s + Math.abs(p.valor), 0);
  const comisiones = payments.reduce((s, p) => s + p.comision, 0);

  const nochesTotales = activas.reduce((s, b) => s + b.noches, 0);
  const ocupacion = Math.round((nochesTotales / (rooms.length * dias)) * 100);
  const tarifaPromedio = nochesTotales ? Math.round(activas.reduce((s, b) => s + b.subtotal, 0) / nochesTotales) : 0;
  const estadiaPromedio = activas.length ? nochesTotales / activas.length : 0;

  const porCanal = ["DIRECTO", "AIRBNB", "WHATSAPP", "TELEFONO"].map((c) => ({
    canal: c,
    reservas: activas.filter((b) => b.canal === c).length,
    ingreso: activas.filter((b) => b.canal === c).reduce((s, b) => s + b.total, 0),
  }));

  const porHabitacion = rooms.map((r) => {
    const list = activas.filter((b) => b.roomId === r.id);
    const noches = list.reduce((s, b) => s + b.noches, 0);
    return {
      nombre: r.nombre,
      reservas: list.length,
      noches,
      ocupacion: Math.round((noches / dias) * 100),
      ingreso: list.reduce((s, b) => s + b.total, 0),
    };
  });

  // Ingresos por mes dentro del rango.
  const meses = new Map<string, { directo: number; airbnb: number }>();
  for (const b of activas) {
    const key = `${b.llegada.getUTCFullYear()}-${String(b.llegada.getUTCMonth() + 1).padStart(2, "0")}`;
    const cur = meses.get(key) ?? { directo: 0, airbnb: 0 };
    if (b.canal === "AIRBNB") cur.airbnb += b.total;
    else cur.directo += b.total;
    meses.set(key, cur);
  }

  return {
    kpis: {
      ingresos,
      reembolsos,
      comisiones,
      ocupacion,
      tarifaPromedio,
      estadiaPromedio,
      reservas: activas.length,
      cancelaciones: bookings.filter((b) => b.estado === "CANCELADA").length,
      resenas: reviews.length,
    },
    porCanal,
    porHabitacion,
    meses: [...meses.entries()].sort().map(([mes, v]) => ({ mes, ...v, total: v.directo + v.airbnb })),
  };
}

export function rangoDefault() {
  const hasta = addDays(new Date(), 1);
  const desde = new Date(hasta);
  desde.setUTCMonth(desde.getUTCMonth() - 6);
  return { desde, hasta };
}
