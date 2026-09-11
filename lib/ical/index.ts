import "server-only";
import { db } from "@/lib/db";
import { OCCUPYING_STATES } from "@/lib/booking/availability";
import { addDays } from "@/lib/dates";

export type IcalEvent = { uid: string; desde: Date; hasta: Date; resumen: string };

/** Parser mínimo de VEVENT (DTSTART/DTEND en formato fecha). */
export function parseIcal(text: string): IcalEvent[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const eventos: IcalEvent[] = [];
  const blocks = unfolded.split("BEGIN:VEVENT").slice(1);
  for (const block of blocks) {
    const get = (key: string) => block.match(new RegExp(`\\n${key}[^:]*:(.+)`))?.[1]?.trim();
    const start = get("DTSTART");
    const end = get("DTEND");
    const uid = get("UID") ?? crypto.randomUUID();
    const resumen = get("SUMMARY") ?? "Reserva Airbnb";
    if (!start || !end) continue;
    const desde = icalDate(start);
    const hasta = icalDate(end);
    if (!desde || !hasta) continue;
    eventos.push({ uid, desde, hasta, resumen });
  }
  return eventos;
}

function icalDate(raw: string): Date | null {
  const m = raw.match(/(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

/** Exporta las reservas + bloqueos de una habitación como ICS. */
export async function exportRoomIcal(roomId: string, roomNombre: string): Promise<string> {
  const [bookings, blocks] = await Promise.all([
    db.booking.findMany({
      where: { roomId, estado: { in: OCCUPYING_STATES } },
      select: { codigo: true, llegada: true, salida: true },
    }),
    db.block.findMany({ where: { roomId, tipo: { not: "AIRBNB" } }, select: { id: true, desde: true, hasta: true, motivo: true } }),
  ]);
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Casa Turistica Valema//Calendario//ES",
    "CALSCALE:GREGORIAN",
  ];
  for (const b of bookings) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${b.codigo}@valema.co`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${fmt(b.llegada)}`,
      `DTEND;VALUE=DATE:${fmt(b.salida)}`,
      `SUMMARY:Reservado — ${roomNombre} (${b.codigo})`,
      "END:VEVENT",
    );
  }
  for (const bl of blocks) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:block-${bl.id}@valema.co`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${fmt(bl.desde)}`,
      `DTEND;VALUE=DATE:${fmt(bl.hasta)}`,
      `SUMMARY:No disponible — ${bl.motivo ?? "bloqueo"}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export type SyncResult = {
  ok: boolean;
  mensaje: string;
  eventos: number;
  conflictos: number;
};

/** Importa el iCal de Airbnb de una habitación: crea/actualiza bloqueos AIRBNB y detecta conflictos. */
export async function syncRoomIcal(roomId: string): Promise<SyncResult> {
  const link = await db.icalLink.findUnique({ where: { roomId } });
  if (!link?.urlEntrada) {
    const res: SyncResult = { ok: false, mensaje: "Sin enlace iCal configurado", eventos: 0, conflictos: 0 };
    await registrarSync(roomId, res);
    return res;
  }

  let texto: string;
  try {
    const r = await fetch(link.urlEntrada, { signal: AbortSignal.timeout(15000), cache: "no-store" });
    if (!r.ok) {
      const res: SyncResult = { ok: false, mensaje: `El enlace respondió con error ${r.status}`, eventos: 0, conflictos: 0 };
      await registrarSync(roomId, res);
      return res;
    }
    texto = await r.text();
  } catch {
    const res: SyncResult = { ok: false, mensaje: "No se pudo contactar el enlace de Airbnb", eventos: 0, conflictos: 0 };
    await registrarSync(roomId, res);
    return res;
  }

  const eventos = parseIcal(texto).filter((e) => e.hasta > addDays(new Date(), -1));
  let conflictos = 0;

  await db.$transaction(async (tx) => {
    // Reemplaza los bloqueos AIRBNB futuros de esta habitación por los eventos importados.
    await tx.block.deleteMany({
      where: { roomId, tipo: "AIRBNB", hasta: { gt: addDays(new Date(), -1) } },
    });
    for (const e of eventos) {
      const choca = await tx.booking.count({
        where: {
          roomId,
          canal: { not: "AIRBNB" },
          estado: { in: OCCUPYING_STATES },
          llegada: { lt: e.hasta },
          salida: { gt: e.desde },
        },
      });
      if (choca > 0) conflictos++;
      await tx.block.create({
        data: {
          roomId,
          desde: e.desde,
          hasta: e.hasta,
          tipo: "AIRBNB",
          motivo: e.resumen.slice(0, 120),
          origen: "airbnb",
          icalUid: `${e.uid}`.slice(0, 190),
        },
      });
    }
  });

  const res: SyncResult = {
    ok: true,
    mensaje: conflictos > 0 ? `Solapamiento con una reserva directa (${conflictos})` : "Al día",
    eventos: eventos.length,
    conflictos,
  };
  await registrarSync(roomId, res);
  return res;
}

async function registrarSync(roomId: string, res: SyncResult) {
  const link = await db.icalLink.findUnique({ where: { roomId } });
  if (!link) return;
  await db.$transaction([
    db.icalLink.update({
      where: { roomId },
      data: { ultimaSync: new Date(), ultimoResultado: res.mensaje, eventos: res.eventos },
    }),
    db.icalSyncLog.create({
      data: { linkId: link.id, ok: res.ok, mensaje: res.mensaje, eventos: res.eventos, conflictos: res.conflictos },
    }),
  ]);
}
