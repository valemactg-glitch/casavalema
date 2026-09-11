import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, bad } from "@/lib/http";
import { roomCalendar } from "@/lib/booking/calendar";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/rooms/[slug]/calendar">) {
  const { slug } = await ctx.params;
  const room = await db.room.findFirst({
    where: { slug, visible: true },
    select: { id: true, nombre: true, estadiaMin: true },
  });
  if (!room) return bad("Habitación no encontrada", 404);

  const calendar = await roomCalendar(room.id, 12);
  return json({
    ok: true,
    habitacion: { slug, nombre: room.nombre, estadiaMin: room.estadiaMin },
    noches: calendar,
  });
}
