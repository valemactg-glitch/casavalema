import "server-only";
import { db } from "@/lib/db";
import { addDays, eachNight, toISODate } from "@/lib/dates";
import { OCCUPYING_STATES } from "@/lib/booking/availability";

function monthRange(base = new Date()) {
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth();
  return { desde: new Date(Date.UTC(y, m, 1)), hasta: new Date(Date.UTC(y, m + 1, 1)) };
}

export async function dashboardData() {
  const hoy = new Date();
  const hoyUTC = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  const manana = addDays(hoyUTC, 1);
  const { desde, hasta } = monthRange(hoy);
  const diasMes = Math.round((hasta.getTime() - desde.getTime()) / 86_400_000);

  const [
    rooms,
    llegadasHoy,
    salidasHoy,
    ocupadasHoy,
    bookingsMes,
    pagosMes,
    porCobrar,
    cancelacionesMes,
    completadas,
    icalConflictos,
    ultimaSync,
  ] = await Promise.all([
    db.room.findMany({ where: { visible: true }, orderBy: { orden: "asc" }, select: { id: true, nombre: true } }),
    db.booking.findMany({
      where: { estado: { in: ["CONFIRMADA", "PAGO_PARCIAL"] }, llegada: hoyUTC },
      include: { room: { select: { nombre: true } }, guest: { select: { nombre: true, apellidos: true } } },
    }),
    db.booking.findMany({
      where: { estado: { in: ["EN_CURSO", "CONFIRMADA"] }, salida: hoyUTC },
      include: { room: { select: { nombre: true } }, guest: { select: { nombre: true, apellidos: true } } },
    }),
    db.booking.count({
      where: { estado: { in: OCCUPYING_STATES }, llegada: { lte: hoyUTC }, salida: { gt: hoyUTC } },
    }),
    db.booking.findMany({
      where: {
        estado: { in: [...OCCUPYING_STATES, "PENDIENTE_PAGO"] },
        llegada: { lt: hasta },
        salida: { gt: desde },
      },
      select: { llegada: true, salida: true, canal: true, roomId: true },
    }),
    db.payment.aggregate({ where: { estado: "APROBADO", createdAt: { gte: desde, lt: hasta } }, _sum: { valor: true } }),
    db.booking.findMany({
      where: { estado: { in: ["CONFIRMADA", "PAGO_PARCIAL", "PENDIENTE_PAGO"] }, saldo: { gt: 0 } },
      include: { room: { select: { nombre: true } }, guest: { select: { nombre: true, apellidos: true } } },
      orderBy: { llegada: "asc" },
      take: 8,
    }),
    db.booking.count({ where: { estado: "CANCELADA", updatedAt: { gte: desde, lt: hasta } } }),
    db.booking.findMany({
      where: { estado: { in: ["COMPLETADA", "EN_CURSO", "CONFIRMADA"] } },
      select: { noches: true },
    }),
    db.icalLink.findMany({
      where: { ultimoResultado: { contains: "Solapamiento" } },
      include: { room: { select: { nombre: true } } },
    }),
    db.icalLink.findFirst({ where: { ultimaSync: { not: null } }, orderBy: { ultimaSync: "desc" }, select: { ultimaSync: true } }),
  ]);

  // Ocupación por habitación en el mes.
  const nightsPerRoom = new Map<string, { directo: number; airbnb: number }>();
  for (const b of bookingsMes) {
    const noches = eachNight(b.llegada, b.salida).filter((n) => n >= desde && n < hasta).length;
    const cur = nightsPerRoom.get(b.roomId) ?? { directo: 0, airbnb: 0 };
    if (b.canal === "AIRBNB") cur.airbnb += noches;
    else cur.directo += noches;
    nightsPerRoom.set(b.roomId, cur);
  }
  const ocupacion = rooms.map((r) => {
    const n = nightsPerRoom.get(r.id) ?? { directo: 0, airbnb: 0 };
    const total = n.directo + n.airbnb;
    return { ...r, directo: n.directo, airbnb: n.airbnb, pct: Math.round((total / diasMes) * 100) };
  });
  const ocupacionMedia = Math.round(ocupacion.reduce((s, o) => s + o.pct, 0) / (ocupacion.length || 1));

  const estadiaPromedio = completadas.length
    ? completadas.reduce((s, b) => s + b.noches, 0) / completadas.length
    : 0;

  const reservasHoy = await db.booking.count({
    where: { createdAt: { gte: hoyUTC, lt: manana }, estado: { not: "CANCELADA" } },
  });
  const directoHoy = await db.booking.count({
    where: { createdAt: { gte: hoyUTC, lt: manana }, canal: "DIRECTO", estado: { not: "CANCELADA" } },
  });

  return {
    fecha: hoy,
    ultimaSync: ultimaSync?.ultimaSync ?? null,
    conflictos: icalConflictos,
    kpis: {
      reservasHoy,
      directoHoy,
      ocupacionMedia,
      ingresosMes: pagosMes._sum.valor ?? 0,
      porCobrarTotal: porCobrar.reduce((s, b) => s + b.saldo, 0),
      porCobrarCount: porCobrar.length,
      estadiaPromedio,
      cancelacionesMes,
      ocupadasHoy,
      disponiblesHoy: rooms.length - ocupadasHoy,
    },
    ocupacion,
    llegadasHoy,
    salidasHoy,
    porCobrar,
  };
}

/** Barras del calendario maestro para un rango de días. */
export async function calendarStrip(desde: Date, dias: number) {
  const hasta = addDays(desde, dias);
  const rooms = await db.room.findMany({
    where: { visible: true },
    orderBy: { orden: "asc" },
    select: {
      id: true,
      nombre: true,
      precioBase: true,
      capacidadAdultos: true,
      capacidadNinos: true,
    },
  });

  const [bookings, blocks] = await Promise.all([
    db.booking.findMany({
      where: {
        estado: { notIn: ["CANCELADA", "NO_SHOW"] },
        llegada: { lt: hasta },
        salida: { gt: desde },
      },
      include: { guest: { select: { nombre: true, apellidos: true } } },
    }),
    db.block.findMany({ where: { desde: { lt: hasta }, hasta: { gt: desde } } }),
  ]);

  const filas = rooms.map((r) => {
    const barras: {
      tipo: string;
      left: number;
      width: number;
      label: string;
      id: string;
      href?: string;
    }[] = [];

    for (const b of bookings.filter((x) => x.roomId === r.id)) {
      const start = Math.max(0, Math.round((b.llegada.getTime() - desde.getTime()) / 86_400_000));
      const end = Math.min(dias, Math.round((b.salida.getTime() - desde.getTime()) / 86_400_000));
      if (end <= start) continue;
      let tipo = "directa";
      if (b.canal === "AIRBNB") tipo = "airbnb";
      else if (b.estado === "PENDIENTE_PAGO") tipo = "pendiente";
      else if (b.estado === "EN_CURSO" || b.checkInAt) tipo = "encurso";
      barras.push({
        tipo,
        left: (start / dias) * 100,
        width: ((end - start) / dias) * 100,
        label: `${b.canal === "AIRBNB" ? "Airbnb" : "Directa"} · ${b.guest.apellidos || b.guest.nombre}${
          b.checkInAt ? " · check-in" : ""
        }`,
        id: b.id,
        href: `/admin/reservas/${b.codigo}`,
      });
    }
    for (const bl of blocks.filter((x) => x.roomId === r.id)) {
      const start = Math.max(0, Math.round((bl.desde.getTime() - desde.getTime()) / 86_400_000));
      const end = Math.min(dias, Math.round((bl.hasta.getTime() - desde.getTime()) / 86_400_000));
      if (end <= start) continue;
      barras.push({
        tipo: bl.tipo === "AIRBNB" ? "airbnb" : bl.tipo.toLowerCase(),
        left: (start / dias) * 100,
        width: ((end - start) / dias) * 100,
        label: `${bl.tipo[0] + bl.tipo.slice(1).toLowerCase()}${bl.motivo ? ` · ${bl.motivo}` : ""}`,
        id: bl.id,
      });
    }
    return { room: r, barras };
  });

  const columnas = Array.from({ length: dias }, (_, i) => {
    const d = addDays(desde, i);
    return { fecha: toISODate(d), dia: d.getUTCDate(), dow: d.getUTCDay(), finde: d.getUTCDay() === 0 || d.getUTCDay() === 6 };
  });

  return { rooms, filas, columnas };
}
