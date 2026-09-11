import { getBookingByToken } from "@/lib/booking/get";
import { LEGAL_INFO } from "@/lib/nav";

function icsDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export async function GET(_req: Request, ctx: RouteContext<"/api/calendario/[token]">) {
  const { token } = await ctx.params;
  const booking = await getBookingByToken(token);
  if (!booking) return new Response("No encontrada", { status: 404 });

  const uid = `${booking.codigo}@valema.co`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Casa Turistica Valema//Reservas//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(new Date(booking.llegada))}`,
    `DTEND;VALUE=DATE:${icsDate(new Date(booking.salida))}`,
    `SUMMARY:${escapeIcs(`Estadía en ${booking.room.nombre} · ${LEGAL_INFO.razonSocial}`)}`,
    `DESCRIPTION:${escapeIcs(
      `Reserva ${booking.codigo}. Check-in desde las 15:00, check-out hasta las 11:00. Gestiona tu reserva en valema.co/mi-reserva.`,
    )}`,
    `LOCATION:${escapeIcs("La dirección exacta se comparte al confirmar la reserva")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(lines.join("\r\n"), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="valema-${booking.codigo}.ics"`,
    },
  });
}

function escapeIcs(s: string): string {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}
