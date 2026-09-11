import { AdminHeader, Panel, KpiCard, Table, Th, Td } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { reportes, rangoDefault } from "@/lib/admin/reportes";
import { formatCOP } from "@/lib/format";
import { parseISODate, toISODate } from "@/lib/dates";
import { CANAL_LABEL } from "@/lib/admin/estados";

export default async function ReportesPage(props: PageProps<"/admin/reportes">) {
  await requireUser("reportes");
  const sp = await props.searchParams;
  const def = rangoDefault();
  const desde = parseISODate(typeof sp.desde === "string" ? sp.desde : undefined) ?? def.desde;
  const hasta = parseISODate(typeof sp.hasta === "string" ? sp.hasta : undefined) ?? def.hasta;

  const r = await reportes(desde, hasta);
  const maxMes = Math.max(1, ...r.meses.map((m) => m.total));
  const totalCanal = Math.max(1, r.porCanal.reduce((s, c) => s + c.reservas, 0));

  return (
    <>
      <AdminHeader
        title="Reportes"
        subtitle={`${toISODate(desde)} → ${toISODate(hasta)}`}
        actions={
          <a
            href={`data:text/csv,${encodeURIComponent(
              "habitacion,reservas,noches,ocupacion,ingreso\n" +
                r.porHabitacion.map((h) => `${h.nombre},${h.reservas},${h.noches},${h.ocupacion},${h.ingreso}`).join("\n"),
            )}`}
            download="reporte-habitaciones.csv"
          >
            <Button variant="outline" size="sm">
              Exportar CSV
            </Button>
          </a>
        }
      />

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <input type="date" name="desde" defaultValue={toISODate(desde)} className="h-9 rounded-sm border border-hairline px-2 text-[12px]" />
        <input type="date" name="hasta" defaultValue={toISODate(hasta)} className="h-9 rounded-sm border border-hairline px-2 text-[12px]" />
        <Button type="submit" variant="outline" size="sm">
          Aplicar
        </Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Ingresos" value={formatCOP(r.kpis.ingresos)} hint={`comisiones ${formatCOP(r.kpis.comisiones)}`} />
        <KpiCard label="Ocupación" value={`${r.kpis.ocupacion} %`} />
        <KpiCard label="Tarifa promedio / noche" value={formatCOP(r.kpis.tarifaPromedio)} />
        <KpiCard label="Estadía promedio" value={`${r.kpis.estadiaPromedio.toFixed(1)} noches`} />
        <KpiCard label="Cancelaciones" value={r.kpis.cancelaciones} hint={`${r.kpis.reservas} reservas`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Ingresos por mes">
          <ul className="space-y-2">
            {r.meses.map((m) => (
              <li key={m.mes}>
                <div className="flex justify-between text-[11.5px]">
                  <span>{m.mes}</span>
                  <span className="text-ink-3">{formatCOP(m.total)}</span>
                </div>
                <div className="mt-0.5 flex h-2.5 overflow-hidden rounded-pill bg-neutro-bg">
                  <span className="bg-carbon" style={{ width: `${(m.directo / maxMes) * 100}%` }} />
                  <span className="bg-oro" style={{ width: `${(m.airbnb / maxMes) * 100}%` }} />
                </div>
              </li>
            ))}
            {r.meses.length === 0 && <li className="text-[12px] text-ink-3">Sin datos en el rango.</li>}
          </ul>
        </Panel>

        <Panel title="Mezcla de canales">
          <ul className="space-y-2">
            {r.porCanal.map((c) => (
              <li key={c.canal}>
                <div className="flex justify-between text-[11.5px]">
                  <span>{CANAL_LABEL[c.canal]}</span>
                  <span className="text-ink-3">
                    {c.reservas} reservas · {formatCOP(c.ingreso)}
                  </span>
                </div>
                <div className="mt-0.5 h-2.5 overflow-hidden rounded-pill bg-neutro-bg">
                  <span className="block h-full rounded-pill bg-oro" style={{ width: `${(c.reservas / totalCanal) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Desempeño por habitación" className="mt-4">
        <Table className="min-w-[520px]">
          <thead>
            <tr>
              <Th>Habitación</Th>
              <Th>Reservas</Th>
              <Th>Noches</Th>
              <Th>Ocupación</Th>
              <Th className="text-right">Ingreso</Th>
            </tr>
          </thead>
          <tbody>
            {r.porHabitacion.map((h) => (
              <tr key={h.nombre}>
                <Td>{h.nombre}</Td>
                <Td>{h.reservas}</Td>
                <Td>{h.noches}</Td>
                <Td>{h.ocupacion} %</Td>
                <Td className="text-right font-medium">{formatCOP(h.ingreso)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {r.porHabitacion.length > 0 && (
          <p className="mt-2 text-[11.5px] text-ink-2">
            {[...r.porHabitacion].sort((a, b) => b.ingreso - a.ingreso)[0].nombre} es la
            habitación que más ingresos genera en el periodo.
          </p>
        )}
      </Panel>
    </>
  );
}
