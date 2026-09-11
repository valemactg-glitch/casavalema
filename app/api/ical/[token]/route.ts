import { db } from "@/lib/db";
import { exportRoomIcal } from "@/lib/ical";

/** Enlace iCal propio para exportar la disponibilidad de una habitación a Airbnb. */
export async function GET(_req: Request, ctx: RouteContext<"/api/ical/[token]">) {
  const { token } = await ctx.params;
  const link = await db.icalLink.findFirst({
    where: { tokenSalida: token },
    include: { room: { select: { id: true, nombre: true } } },
  });
  if (!link) return new Response("No encontrado", { status: 404 });

  const ics = await exportRoomIcal(link.room.id, link.room.nombre);
  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `inline; filename="valema-${link.room.nombre.toLowerCase()}.ics"`,
      "cache-control": "no-store",
    },
  });
}
