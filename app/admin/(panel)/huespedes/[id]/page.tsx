import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, Panel, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { formatCOP } from "@/lib/format";
import { formatRangeEs, formatDateLongEs } from "@/lib/dates";
import { ESTADO_LABEL } from "@/lib/admin/estados";
import { guardarHuesped, marcarEliminacion } from "../actions";

export default async function HuespedPage(props: PageProps<"/admin/huespedes/[id]">) {
  const user = await requireUser("huespedes");
  const { id } = await props.params;
  const g = await db.guest.findUnique({
    where: { id },
    include: {
      bookings: { include: { room: { select: { nombre: true } }, payments: { where: { estado: "APROBADO" } } }, orderBy: { llegada: "desc" } },
    },
  });
  if (!g) notFound();

  const w = can(user.rol, "huespedes", "write");
  const cons = (g.consentimientos as Record<string, unknown>) ?? {};
  const gasto = g.bookings.flatMap((b) => b.payments).reduce((s, p) => s + p.valor, 0);

  return (
    <>
      <AdminHeader
        title={`${g.nombre} ${g.apellidos}`}
        subtitle={
          <>
            <Link href="/admin/huespedes" className="hover:text-carbon">
              Huéspedes
            </Link>{" "}
            · registrado el {formatDateLongEs(g.createdAt)}
          </>
        }
        actions={
          <a
            href={`data:application/json,${encodeURIComponent(JSON.stringify({ ...g, consentimientos: cons }, null, 2))}`}
            download={`huesped-${g.id}.json`}
          >
            <Button variant="outline" size="sm">
              Exportar datos
            </Button>
          </a>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Panel title="Datos de contacto">
            <dl className="grid gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-2">
              {[
                ["Documento", g.docNumero ? `${g.docTipo} ${g.docNumero}` : "—"],
                ["Correo", g.correo],
                ["Teléfono", g.telefono],
                ["País / ciudad", [g.pais, g.ciudad].filter(Boolean).join(" · ")],
                ["Gasto total", formatCOP(gasto)],
                ["Estadías", String(g.bookings.length)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="font-medium text-carbon">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Historial de reservas">
            <ul className="divide-y divide-hairline text-[12.5px]">
              {g.bookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/admin/reservas/${b.codigo}`} className="hover:text-oro-texto">
                    {b.codigo} · {b.room.nombre} · {formatRangeEs(b.llegada, b.salida)}
                  </Link>
                  <Pill tone={ESTADO_LABEL[b.estado].tone}>{ESTADO_LABEL[b.estado].label}</Pill>
                </li>
              ))}
              {g.bookings.length === 0 && <li className="py-2 text-ink-3">Sin reservas.</li>}
            </ul>
          </Panel>
        </div>

        <aside className="space-y-4">
          {w && (
            <Panel title="Notas y preferencias">
              <form action={guardarHuesped} className="space-y-2">
                <input type="hidden" name="id" value={g.id} />
                <label className="text-[11px] text-ink-2">
                  Preferencias
                  <textarea name="preferencias" defaultValue={g.preferencias ?? ""} rows={2} className="mt-1 w-full rounded-sm border border-hairline p-2 text-[12px]" />
                </label>
                <label className="text-[11px] text-ink-2">
                  Nota privada
                  <textarea name="notasPrivadas" defaultValue={g.notasPrivadas ?? ""} rows={3} className="mt-1 w-full rounded-sm border border-hairline p-2 text-[12px]" />
                </label>
                <label className="text-[11px] text-ink-2">
                  Etiquetas (coma)
                  <input name="etiquetas" defaultValue={g.etiquetas.join(", ")} className="mt-1 w-full rounded-sm border border-hairline p-2 text-[12px]" />
                </label>
                <Button type="submit" variant="outline" size="sm">
                  Guardar
                </Button>
              </form>
            </Panel>
          )}

          <Panel title="Consentimientos">
            <ul className="space-y-1 text-[12px]">
              <li>Políticas: {cons.politicas ? "aceptadas" : "—"}</li>
              <li>Tratamiento de datos: {cons.datos ? "autorizado" : "—"}</li>
              <li>Comunicaciones: {cons.comunicaciones ? "sí" : "no"}</li>
            </ul>
          </Panel>

          {w && (
            <Panel title="Protección de datos">
              <p className="mb-2 text-[11.5px] text-ink-2">
                {g.solicitudEliminacion
                  ? "Este huésped solicitó la eliminación de sus datos."
                  : "Sin solicitud de eliminación."}
              </p>
              <form action={marcarEliminacion}>
                <input type="hidden" name="id" value={g.id} />
                <Button type="submit" variant="outline" size="sm">
                  {g.solicitudEliminacion ? "Quitar marca" : "Marcar solicitud de eliminación"}
                </Button>
              </form>
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}
