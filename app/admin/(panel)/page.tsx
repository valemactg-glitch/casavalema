import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AdminHeader, Panel, KpiCard } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { dashboardData } from "@/lib/admin/metrics";
import { formatCOP } from "@/lib/format";
import { formatDateLongEs, formatDateEs } from "@/lib/dates";

function haceCuanto(d: Date | null): string {
  if (!d) return "sin sincronizar";
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 60) return `hace ${min} min`;
  return `hace ${Math.floor(min / 60)} h ${min % 60} min`;
}

export default async function DashboardPage() {
  const user = await requireUser("dashboard");
  const d = await dashboardData();
  const hora = d.fecha.getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <>
      <AdminHeader
        title={`${saludo}, ${user.nombre.split(" ")[0]}`}
        subtitle={`${formatDateLongEs(d.fecha)} · última sincronización con Airbnb ${haceCuanto(d.ultimaSync)}`}
        actions={
          <>
            <Button href="/admin/calendario" variant="outline" size="sm">
              Bloquear fechas
            </Button>
            <Button href="/admin/reservas/nueva" variant="primary" size="sm">
              Nueva reserva
            </Button>
          </>
        }
      />

      {d.conflictos.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md bg-error-soft-bg px-4 py-3 text-error-fg">
          <div>
            <p className="text-[13px] font-semibold">
              Posible conflicto de disponibilidad en {d.conflictos.map((c) => c.room.nombre).join(", ")}
            </p>
            <p className="text-[12px]">
              Airbnb importó un evento que se solapa con una reserva directa. Nada se canceló
              automáticamente.
            </p>
          </div>
          <Button href="/admin/calendario" variant="danger" size="sm">
            Revisar conflicto
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Reservas de hoy"
          value={d.kpis.reservasHoy}
          hint={`${d.kpis.directoHoy} directas · ${d.kpis.reservasHoy - d.kpis.directoHoy} Airbnb`}
        />
        <KpiCard label="Ocupación del mes" value={`${d.kpis.ocupacionMedia} %`} hint="promedio de las 5 habitaciones" />
        <KpiCard label="Ingresos del mes" value={formatCOP(d.kpis.ingresosMes)} hint="pagos aprobados" />
        <KpiCard
          label="Pagos por cobrar"
          value={formatCOP(d.kpis.porCobrarTotal)}
          hint={`${d.kpis.porCobrarCount} reservas`}
          tone={d.kpis.porCobrarCount ? "warn" : "default"}
        />
        <KpiCard label="Estadía promedio" value={`${d.kpis.estadiaPromedio.toFixed(1)} noches`} />
        <KpiCard
          label="Cancelaciones"
          value={d.kpis.cancelacionesMes}
          hint="este mes"
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Panel title="Ocupación por habitación">
          <ul className="space-y-3">
            {d.ocupacion.map((o) => (
              <li key={o.id}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium text-carbon">{o.nombre}</span>
                  <span className="text-ink-3">{o.pct} %</span>
                </div>
                <div className="mt-1 flex h-2 overflow-hidden rounded-pill bg-neutro-bg">
                  <span className="bg-carbon" style={{ width: `${(o.directo / 31) * 100}%` }} />
                  <span className="bg-oro" style={{ width: `${(o.airbnb / 31) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex gap-4 text-[10.5px] text-ink-3">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-carbon" /> Directa
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-oro" /> Airbnb
            </span>
          </p>
        </Panel>

        <Panel title="Llegadas y salidas de hoy">
          {d.llegadasHoy.length + d.salidasHoy.length === 0 ? (
            <p className="text-[12.5px] text-ink-3">Sin movimientos hoy.</p>
          ) : (
            <ul className="space-y-2 text-[12.5px]">
              {d.llegadasHoy.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2">
                  <span>
                    <span className="mr-2 rounded-pill bg-exito-bg px-1.5 py-0.5 text-[9.5px] font-semibold uppercase text-exito-fg">
                      Llega
                    </span>
                    {b.guest.nombre} {b.guest.apellidos} · {b.room.nombre}
                  </span>
                  <span className="text-ink-3">{b.horaLlegada ?? "hora s/c"}</span>
                </li>
              ))}
              {d.salidasHoy.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2">
                  <span>
                    <span className="mr-2 rounded-pill bg-info-bg px-1.5 py-0.5 text-[9.5px] font-semibold uppercase text-info-fg">
                      Sale
                    </span>
                    {b.guest.nombre} {b.guest.apellidos} · {b.room.nombre}
                  </span>
                  <span className="text-ink-3">saldo {formatCOP(b.saldo)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Pagos por cobrar">
          {d.porCobrar.length === 0 ? (
            <p className="text-[12.5px] text-ink-3">Nada pendiente. </p>
          ) : (
            <ul className="space-y-2 text-[12.5px]">
              {d.porCobrar.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2">
                  <Link href={`/admin/reservas/${b.codigo}`} className="hover:text-oro-texto">
                    {b.codigo} · {b.guest.apellidos || b.guest.nombre}
                  </Link>
                  <span className="font-medium text-carbon">{formatCOP(b.saldo)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="mt-6 text-[11px] text-ink-3">
        Habitaciones ocupadas ahora: {d.kpis.ocupadasHoy} · disponibles: {d.kpis.disponiblesHoy} ·
        hoy es {formatDateEs(new Date(Date.UTC(d.fecha.getUTCFullYear(), d.fecha.getUTCMonth(), d.fecha.getUTCDate())))}
      </p>
    </>
  );
}
