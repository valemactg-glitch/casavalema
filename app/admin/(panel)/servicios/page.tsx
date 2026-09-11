import { AdminHeader, Panel, Table, Th, Td, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { formatCOP } from "@/lib/format";
import { cobroLabel } from "@/lib/booking/pricing";
import { guardarServicio } from "./actions";

const COBROS = ["UNA_VEZ", "POR_NOCHE", "POR_HABITACION", "POR_HUESPED", "BAJO_SOLICITUD"];
const DISPS = ["INCLUIDO", "ADICIONAL", "BAJO_SOLICITUD", "NO_DISPONIBLE"];

export default async function ServiciosAdminPage() {
  const user = await requireUser("servicios");
  const w = can(user.rol, "servicios", "write");
  const servicios = await db.service.findMany({ orderBy: { orden: "asc" }, include: { _count: { select: { bookingServices: true } } } });

  return (
    <>
      <AdminHeader title="Servicios adicionales" subtitle="Precio, tipo de cobro, cupo y estado" />

      <Panel className="mb-4">
        <Table className="min-w-[640px]">
          <thead>
            <tr>
              <Th>Servicio</Th>
              <Th>Precio</Th>
              <Th>Cobro</Th>
              <Th>Cupo</Th>
              <Th>Estado</Th>
              <Th>Usos</Th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((s) => (
              <tr key={s.id}>
                <Td>
                  <span className="font-medium">{s.nombre}</span>
                  <span className="block text-[11px] text-ink-3">{s.descripcion}</span>
                </Td>
                <Td>{s.precio ? `${formatCOP(s.precio)} ${cobroLabel(s.tipoCobro)}` : "s/c"}</Td>
                <Td>{cobroLabel(s.tipoCobro)}</Td>
                <Td>{s.cupo ?? "sin límite"}</Td>
                <Td>
                  <Pill
                    tone={
                      s.disponibilidad === "NO_DISPONIBLE" || !s.activo
                        ? "neutro"
                        : s.disponibilidad === "INCLUIDO"
                          ? "exito"
                          : s.disponibilidad === "BAJO_SOLICITUD"
                            ? "aviso"
                            : "info"
                    }
                  >
                    {!s.activo ? "inactivo" : s.disponibilidad.replace("_", " ").toLowerCase()}
                  </Pill>
                </Td>
                <Td>{s._count.bookingServices}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-2 text-[11px] text-ink-3">
          Si el cupo diario se agota, el servicio deja de ofrecerse ese día y pasa a
          &quot;bajo solicitud&quot;.
        </p>
      </Panel>

      {w && (
        <Panel title="Crear o editar un servicio">
          <form action={guardarServicio} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value="" />
            <input name="nombre" placeholder="Nombre" required className="rounded-sm border border-hairline px-2 py-1.5 text-[12px]" />
            <input name="precio" type="number" placeholder="Precio (COP)" className="rounded-sm border border-hairline px-2 py-1.5 text-[12px]" />
            <textarea name="descripcion" placeholder="Descripción" required rows={2} className="rounded-sm border border-hairline p-2 text-[12px] sm:col-span-2" />
            <select name="tipoCobro" className="rounded-sm border border-hairline px-2 py-1.5 text-[12px]">
              {COBROS.map((c) => (
                <option key={c} value={c}>
                  {cobroLabel(c)}
                </option>
              ))}
            </select>
            <select name="disponibilidad" className="rounded-sm border border-hairline px-2 py-1.5 text-[12px]">
              {DISPS.map((d) => (
                <option key={d} value={d}>
                  {d.replace("_", " ").toLowerCase()}
                </option>
              ))}
            </select>
            <input name="cupo" type="number" placeholder="Cupo diario (vacío = sin límite)" className="rounded-sm border border-hairline px-2 py-1.5 text-[12px]" />
            <input name="anticipacionHoras" type="number" placeholder="Anticipación (horas)" className="rounded-sm border border-hairline px-2 py-1.5 text-[12px]" />
            <label className="flex items-center gap-2 text-[12px]">
              <input type="checkbox" name="activo" defaultChecked className="accent-carbon" /> Activo
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" variant="primary" size="sm">
                Guardar servicio
              </Button>
            </div>
          </form>
        </Panel>
      )}
    </>
  );
}
