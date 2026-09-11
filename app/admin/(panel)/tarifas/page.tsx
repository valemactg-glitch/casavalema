import { AdminHeader, Panel, Table, Th, Td, Pill, ReadOnlyNote } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { BulkRateForm } from "@/components/admin/BulkRateForm";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { formatCOP } from "@/lib/format";
import { addDays, today, toISODate, formatDateEs, formatDateLongEs } from "@/lib/dates";
import { crearTemporada, toggleTemporada, crearPromo, togglePromo } from "./actions";

const DIAS_GRID = 10;

export default async function TarifasPage() {
  const user = await requireUser("tarifas");
  const w = can(user.rol, "tarifas", "write");
  const desde = today();
  const hasta = addDays(desde, DIAS_GRID);

  const [rooms, avail, seasons, promos] = await Promise.all([
    db.room.findMany({ where: { visible: true }, orderBy: { orden: "asc" }, select: { id: true, nombre: true } }),
    db.availability.findMany({ where: { fecha: { gte: desde, lt: hasta } }, orderBy: { fecha: "asc" } }),
    db.season.findMany({ orderBy: { desde: "asc" } }),
    db.promoCode.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const byKey = new Map(avail.map((a) => [`${a.roomId}|${toISODate(a.fecha)}`, a]));
  const columnas = Array.from({ length: DIAS_GRID }, (_, i) => addDays(desde, i));

  return (
    <>
      <AdminHeader title="Tarifas y disponibilidad" subtitle="Edita varios días sin ir uno por uno" />
      {!w && <ReadOnlyNote />}

      {w && (
        <Panel title="Editor masivo" className="mb-4">
          <BulkRateForm rooms={rooms} />
        </Panel>
      )}

      <Panel title={`Próximos ${DIAS_GRID} días`} className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[11.5px]">
            <thead>
              <tr>
                <th className="border-b border-hairline pb-2 pr-2 text-left text-ink-3">Habitación</th>
                {columnas.map((c) => (
                  <th key={c.toISOString()} className="border-b border-hairline pb-2 text-center text-ink-3">
                    {formatDateEs(c, { year: false })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id}>
                  <td className="border-b border-hairline/70 py-2 pr-2 font-medium text-carbon">{r.nombre}</td>
                  {columnas.map((c) => {
                    const a = byKey.get(`${r.id}|${toISODate(c)}`);
                    return (
                      <td
                        key={c.toISOString()}
                        className={`border-b border-hairline/70 py-2 text-center ${a?.cerrado ? "bg-[#E4E2DA] text-ink-3" : ""}`}
                      >
                        {a ? (
                          <>
                            <div className="text-carbon">{Math.round(a.precio / 1000)}k</div>
                            {a.estadiaMin > 1 && <div className="text-[9px] text-oro-texto">mín {a.estadiaMin}</div>}
                            {a.cerrado && <div className="text-[9px]">cerrado</div>}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Temporadas">
          <Table className="min-w-[380px]">
            <thead>
              <tr>
                <Th>Temporada</Th>
                <Th>Rango</Th>
                <Th>Ajuste</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => (
                <tr key={s.id}>
                  <Td>{s.nombre}</Td>
                  <Td>
                    {formatDateEs(s.desde, { weekday: false })} – {formatDateEs(s.hasta, { weekday: false })}
                  </Td>
                  <Td>+{s.ajustePct}%</Td>
                  <Td>
                    {w ? (
                      <form action={toggleTemporada}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="text-[11px] underline">{s.activa ? "Desactivar" : "Activar"}</button>
                      </form>
                    ) : (
                      <Pill tone={s.activa ? "exito" : "neutro"}>{s.activa ? "activa" : "inactiva"}</Pill>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {w && (
            <form action={crearTemporada} className="mt-3 grid gap-2 border-t border-hairline pt-3 sm:grid-cols-2">
              <input name="nombre" placeholder="Nombre" required className="rounded-sm border border-hairline px-2 py-1 text-[12px] sm:col-span-2" />
              <input name="desde" type="date" required className="rounded-sm border border-hairline px-2 py-1 text-[12px]" />
              <input name="hasta" type="date" required className="rounded-sm border border-hairline px-2 py-1 text-[12px]" />
              <input name="ajustePct" type="number" placeholder="Ajuste %" required className="rounded-sm border border-hairline px-2 py-1 text-[12px]" />
              <Button type="submit" variant="outline" size="sm">Crear temporada</Button>
            </form>
          )}
          <p className="mt-2 text-[10.5px] text-ink-3">
            Las temporadas son de referencia; el precio real de cada noche se aplica con el
            editor masivo.
          </p>
        </Panel>

        <Panel title="Códigos promocionales">
          <Table className="min-w-[380px]">
            <thead>
              <tr>
                <Th>Código</Th>
                <Th>Descuento</Th>
                <Th>Usos</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {promos.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <span className="font-mono">{p.codigo}</span>
                    <span className="block text-[10.5px] text-ink-3">{p.descripcion}</span>
                  </Td>
                  <Td>{p.tipo === "PORCENTAJE" ? `${p.valor}%` : formatCOP(p.valor)}</Td>
                  <Td>{p.usos}{p.usosMax ? `/${p.usosMax}` : ""}</Td>
                  <Td>
                    {w ? (
                      <form action={togglePromo}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="text-[11px] underline">{p.activo ? "Desactivar" : "Activar"}</button>
                      </form>
                    ) : (
                      <Pill tone={p.activo ? "exito" : "neutro"}>{p.activo ? "activo" : "inactivo"}</Pill>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {w && (
            <form action={crearPromo} className="mt-3 grid gap-2 border-t border-hairline pt-3 sm:grid-cols-2">
              <input name="codigo" placeholder="CÓDIGO" required className="rounded-sm border border-hairline px-2 py-1 text-[12px] uppercase" />
              <select name="tipo" className="rounded-sm border border-hairline px-2 py-1 text-[12px]">
                <option value="PORCENTAJE">Porcentaje</option>
                <option value="MONTO">Monto fijo</option>
              </select>
              <input name="valor" type="number" placeholder="Valor" required className="rounded-sm border border-hairline px-2 py-1 text-[12px]" />
              <input name="minNoches" type="number" placeholder="Noches mín." className="rounded-sm border border-hairline px-2 py-1 text-[12px]" />
              <input name="descripcion" placeholder="Descripción" className="rounded-sm border border-hairline px-2 py-1 text-[12px] sm:col-span-2" />
              <Button type="submit" variant="outline" size="sm">Guardar código</Button>
            </form>
          )}
        </Panel>
      </div>

      <p className="mt-4 text-[11px] text-ink-3">Datos al {formatDateLongEs(new Date())}.</p>
    </>
  );
}
