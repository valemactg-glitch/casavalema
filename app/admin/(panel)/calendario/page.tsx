import { AdminHeader, Panel, ReadOnlyNote } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { CalendarStrip } from "@/components/admin/CalendarStrip";
import { BlockPanel } from "@/components/admin/BlockPanel";
import { IcalPanel } from "@/components/admin/IcalPanel";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { calendarStrip } from "@/lib/admin/metrics";
import { db } from "@/lib/db";
import { parseISODate, today, toISODate } from "@/lib/dates";

const DIAS = 14;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function haceCuanto(d: Date | null): string | null {
  if (!d) return null;
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 60) return `hace ${min} min`;
  return `hace ${Math.floor(min / 60)} h ${min % 60} min`;
}

export default async function CalendarioPage(props: PageProps<"/admin/calendario">) {
  const user = await requireUser("calendario");
  const sp = await props.searchParams;
  const desde = parseISODate(typeof sp.desde === "string" ? sp.desde : undefined) ?? today();

  const [{ filas, columnas, rooms }, icalLinks] = await Promise.all([
    calendarStrip(desde, DIAS),
    db.icalLink.findMany({ include: { room: { select: { id: true, nombre: true } } } }),
  ]);

  const puedeEditar = can(user.rol, "calendario", "write");

  const icalRows = rooms.map((r) => {
    const link = icalLinks.find((l) => l.roomId === r.id);
    return {
      roomId: r.id,
      nombre: r.nombre,
      urlEntrada: link?.urlEntrada ?? null,
      tokenSalida: link?.tokenSalida ?? "",
      ultimaSync: haceCuanto(link?.ultimaSync ?? null),
      ultimoResultado: link?.ultimoResultado ?? null,
      eventos: link?.eventos ?? 0,
    };
  });

  return (
    <>
      <AdminHeader
        title="Calendario maestro"
        subtitle="Una fila por habitación · ningún cambio se aplica sin confirmación previa"
        actions={
          puedeEditar && (
            <Button href="/admin/reservas/nueva" variant="primary" size="sm">
              Nueva reserva
            </Button>
          )
        }
      />

      {!puedeEditar && <ReadOnlyNote />}

      <CalendarStrip filas={filas} columnas={columnas} desde={toISODate(desde)} dias={DIAS} />

      {puedeEditar && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Panel title="Bloquear noches">
            <BlockPanel rooms={rooms.map((r) => ({ id: r.id, nombre: r.nombre }))} />
          </Panel>
          <Panel title="Sincronización iCal · Airbnb por habitación">
            <IcalPanel rows={icalRows} siteUrl={SITE} />
          </Panel>
        </div>
      )}
    </>
  );
}
