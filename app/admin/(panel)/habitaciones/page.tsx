import Link from "next/link";
import { AdminHeader, Panel, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { formatCOP } from "@/lib/format";
import { today } from "@/lib/dates";
import { moverHabitacion, toggleVisible } from "./actions";

export default async function HabitacionesPage() {
  const user = await requireUser("habitaciones");
  const w = can(user.rol, "habitaciones", "write");
  const rooms = await db.room.findMany({
    orderBy: { orden: "asc" },
    include: {
      _count: { select: { images: true, reviews: true } },
    },
  });
  const futuras = await db.booking.groupBy({
    by: ["roomId"],
    where: { estado: { notIn: ["CANCELADA", "NO_SHOW", "COMPLETADA"] }, salida: { gt: today() } },
    _count: true,
  });
  const futMap = new Map(futuras.map((f) => [f.roomId, f._count]));

  return (
    <>
      <AdminHeader title="Habitaciones" subtitle="Contenido, fotos, servicios, reglas y precios de cada habitación" />

      <div className="space-y-3">
        {rooms.map((r, i) => {
          const conReservas = futMap.get(r.id) ?? 0;
          return (
            <Panel key={r.id} padded={false}>
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  {w && (
                    <div className="flex flex-col">
                      <form action={moverHabitacion}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button disabled={i === 0} className="px-1 text-ink-3 disabled:opacity-30">
                          ▲
                        </button>
                      </form>
                      <form action={moverHabitacion}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button disabled={i === rooms.length - 1} className="px-1 text-ink-3 disabled:opacity-30">
                          ▼
                        </button>
                      </form>
                    </div>
                  )}
                  <div>
                    <p className="flex items-center gap-2 text-[14px] font-semibold text-carbon">
                      {r.nombre}
                      {!r.visible && <Pill tone="neutro">Oculta</Pill>}
                      {r.ventaCerrada && <Pill tone="aviso">Venta cerrada</Pill>}
                    </p>
                    <p className="text-[11.5px] text-ink-3">
                      {r.capacidadAdultos + r.capacidadNinos} huéspedes · desde {formatCOP(r.precioBase)} ·{" "}
                      {r._count.images} fotos · {r._count.reviews} reseñas
                      {conReservas > 0 && ` · ${conReservas} reservas futuras`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button href={`/habitaciones/${r.slug}`} variant="ghost" size="sm">
                    Ver pública
                  </Button>
                  {w && (
                    <>
                      <form action={toggleVisible}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button type="submit" variant="outline" size="sm">
                          {r.visible ? "Ocultar" : "Mostrar"}
                        </Button>
                      </form>
                      <Button href={`/admin/habitaciones/${r.id}`} variant="primary" size="sm">
                        Editar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      <p className="mt-4 text-[11.5px] text-ink-3">
        Una habitación con reservas futuras no se elimina: se cierra la venta. Eliminar
        habitaciones no está disponible en el portal.
      </p>
      <p className="mt-1">
        <Link href="/admin/tarifas" className="text-[12px] text-oro-texto underline">
          Precios por temporada y disponibilidad →
        </Link>
      </p>
    </>
  );
}
