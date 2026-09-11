import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, Panel, Pill, Table, Th, Td } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { formatCOP } from "@/lib/format";
import { formatRangeEs, formatDateLongEs, nightsLabel, guestsLabel } from "@/lib/dates";
import { ESTADO_LABEL, CANAL_LABEL, PAGO_LABEL } from "@/lib/admin/estados";
import {
  checkIn,
  checkOut,
  cancelar,
  marcarNoShow,
  reembolsar,
  agregarNota,
  reenviarConfirmacion,
  registrarPagoManual,
} from "../actions";

export default async function ReservaDetallePage(props: PageProps<"/admin/reservas/[codigo]">) {
  const user = await requireUser("reservas");
  const { codigo } = await props.params;
  const b = await db.booking.findUnique({
    where: { codigo },
    include: {
      room: true,
      guest: true,
      ratePlan: true,
      services: { include: { service: true } },
      companions: true,
      payments: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "desc" } },
      changeRequests: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!b) notFound();

  const abonado = b.payments.filter((p) => p.estado === "APROBADO").reduce((s, p) => s + p.valor, 0);
  const w = can(user.rol, "reservas", "write");
  const wp = can(user.rol, "pagos", "write");
  const estado = ESTADO_LABEL[b.estado];

  return (
    <>
      <AdminHeader
        title={
          <span className="flex items-center gap-3">
            {b.codigo}
            <Pill tone={estado.tone}>{estado.label}</Pill>
          </span>
        }
        subtitle={
          <>
            <Link href="/admin/reservas" className="hover:text-carbon">
              Reservas
            </Link>{" "}
            · creada el {formatDateLongEs(b.createdAt)} · canal {CANAL_LABEL[b.canal]}
          </>
        }
        actions={
          <>
            <Button href={`/comprobante/${b.gestionToken}`} variant="outline" size="sm">
              Comprobante
            </Button>
            {w && (
              <form action={reenviarConfirmacion}>
                <input type="hidden" name="codigo" value={b.codigo} />
                <Button type="submit" variant="outline" size="sm">
                  Reenviar confirmación
                </Button>
              </form>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Panel title="Datos del titular">
            <dl className="grid gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-2">
              {[
                ["Nombre", `${b.guest.nombre} ${b.guest.apellidos}`],
                ["Documento", `${b.guest.docTipo} ${b.guest.docNumero}`],
                ["Correo", b.guest.correo],
                ["Teléfono", b.guest.telefono],
                ["País / ciudad", [b.guest.pais, b.guest.ciudad].filter(Boolean).join(" · ")],
                ["Hora de llegada", b.horaLlegada ?? "sin coordinar"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="font-medium text-carbon">{v}</dd>
                </div>
              ))}
            </dl>
            {b.solicitudes && (
              <p className="mt-3 rounded-md bg-marfil p-3 text-[12px] text-ink-2">
                <span className="font-medium">Solicitudes:</span> {b.solicitudes}
              </p>
            )}
            {b.companions.length > 0 && (
              <p className="mt-2 text-[12px] text-ink-2">
                <span className="font-medium">Acompañantes:</span>{" "}
                {b.companions.map((c) => c.nombre).join(", ")}
              </p>
            )}
          </Panel>

          <Panel title="Reserva">
            <dl className="divide-y divide-hairline text-[12.5px]">
              {[
                ["Habitación", b.room.nombre],
                ["Fechas", `${formatRangeEs(b.llegada, b.salida)} · ${nightsLabel(b.noches)}`],
                ["Huéspedes", guestsLabel(b.adultos, b.ninos)],
                ["Tarifa", `${b.ratePlan?.nombre ?? "—"}${b.ratePlan?.reembolsable ? "" : " · no reembolsable"}`],
                ["Subtotal", formatCOP(b.subtotal)],
                ...(b.descuento ? [["Descuento", `−${formatCOP(b.descuento)}`]] : []),
                ...(b.serviciosTotal ? [["Servicios", formatCOP(b.serviciosTotal)]] : []),
                ["Total", formatCOP(b.total)],
                ["Pagado", formatCOP(abonado)],
                ["Saldo", formatCOP(Math.max(0, b.total - abonado))],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="font-medium text-carbon">{v}</dd>
                </div>
              ))}
            </dl>
            {b.services.length > 0 && (
              <ul className="mt-3 space-y-1 text-[12px] text-ink-2">
                {b.services.map((s) => (
                  <li key={s.id}>
                    {s.service.nombre} · {formatCOP(s.subtotal)}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Pagos">
            {b.payments.length === 0 ? (
              <p className="text-[12px] text-ink-3">Sin pagos registrados.</p>
            ) : (
              <Table className="min-w-[420px]">
                <thead>
                  <tr>
                    <Th>Referencia</Th>
                    <Th>Método</Th>
                    <Th>Estado</Th>
                    <Th className="text-right">Valor</Th>
                  </tr>
                </thead>
                <tbody>
                  {b.payments.map((p) => (
                    <tr key={p.id}>
                      <Td className="font-mono text-[11px]">{p.referencia}</Td>
                      <Td>{p.metodo}</Td>
                      <Td>
                        <Pill tone={PAGO_LABEL[p.estado]?.tone ?? "neutro"}>{PAGO_LABEL[p.estado]?.label ?? p.estado}</Pill>
                      </Td>
                      <Td className="text-right font-medium">{formatCOP(p.valor)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            {wp && (
              <form action={registrarPagoManual} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="codigo" value={b.codigo} />
                <label className="text-[11px] text-ink-2">
                  Valor
                  <input name="valor" type="number" min={1} className="mt-1 block h-9 w-32 rounded-sm border border-hairline px-2 text-[12px]" />
                </label>
                <select name="metodo" className="h-9 rounded-sm border border-hairline px-2 text-[12px]">
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="PSE">PSE</option>
                </select>
                <Button type="submit" variant="outline" size="sm">
                  Registrar pago
                </Button>
              </form>
            )}
          </Panel>

          {b.changeRequests.length > 0 && (
            <Panel title="Solicitudes del huésped">
              <ul className="space-y-2 text-[12px]">
                {b.changeRequests.map((cr) => (
                  <li key={cr.id} className="flex items-start justify-between gap-3">
                    <span className="text-ink-2">
                      <span className="font-medium text-carbon">{cr.tipo}</span> · {cr.detalle}
                    </span>
                    <Pill tone={cr.estado === "APROBADO" ? "exito" : cr.estado === "RECHAZADO" ? "error" : "pendiente"}>
                      {cr.estado.replace("_", " ").toLowerCase()}
                    </Pill>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="Historial">
            <ol className="space-y-1.5 border-l border-hairline pl-4 text-[11.5px] text-ink-3">
              {b.events.map((e) => (
                <li key={e.id}>
                  <span className="text-carbon">{e.detalle}</span> · {e.actor} ·{" "}
                  {formatDateLongEs(e.createdAt)}
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        {/* Acciones */}
        <aside className="space-y-4">
          <Panel title="Acciones">
            {!w ? (
              <p className="text-[12px] text-ink-3">Tu rol no permite modificar reservas.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(b.estado === "CONFIRMADA" || b.estado === "PAGO_PARCIAL") && (
                  <form action={checkIn}>
                    <input type="hidden" name="codigo" value={b.codigo} />
                    <Button type="submit" variant="primary" size="sm" fullWidth>
                      Registrar check-in
                    </Button>
                  </form>
                )}
                {b.estado === "EN_CURSO" && (
                  <form action={checkOut}>
                    <input type="hidden" name="codigo" value={b.codigo} />
                    <Button type="submit" variant="primary" size="sm" fullWidth>
                      Registrar check-out
                    </Button>
                  </form>
                )}
                {["PENDIENTE_PAGO", "CONFIRMADA", "PAGO_PARCIAL"].includes(b.estado) && (
                  <ConfirmAction
                    action={marcarNoShow}
                    trigger="Marcar no-show"
                    title="Marcar como no-show"
                    consecuencias={[
                      { k: "Reserva", v: b.codigo },
                      { k: "Habitación", v: b.room.nombre },
                      { k: "Fechas", v: formatRangeEs(b.llegada, b.salida) },
                    ]}
                    aviso="La habitación quedará libre para esas fechas. Revisa si aplica cargo según la política."
                    confirmar="Marcar no-show"
                    hidden={{ codigo: b.codigo }}
                  />
                )}
                {!["CANCELADA", "COMPLETADA", "REEMBOLSADA"].includes(b.estado) && (
                  <ConfirmAction
                    action={cancelar}
                    trigger="Cancelar reserva"
                    title="Cancelar reserva"
                    tone="danger"
                    consecuencias={[
                      { k: "Reserva", v: b.codigo },
                      { k: "Habitación", v: b.room.nombre },
                      { k: "Fechas", v: formatRangeEs(b.llegada, b.salida) },
                      { k: "Pagado", v: formatCOP(abonado) },
                      { k: "Disponibilidad resultante", v: "Esas noches vuelven a estar libres" },
                    ]}
                    aviso="Se envía el correo de cancelación al huésped. El reembolso se procesa aparte según la política."
                    confirmar="Sí, cancelar"
                    hidden={{ codigo: b.codigo }}
                  />
                )}
                {wp && abonado > 0 && !["REEMBOLSADA"].includes(b.estado) && (
                  <ConfirmAction
                    action={reembolsar}
                    trigger="Reembolsar"
                    title="Reembolsar"
                    tone="danger"
                    consecuencias={[
                      { k: "Reserva", v: b.codigo },
                      { k: "Pagado", v: formatCOP(abonado) },
                      { k: "Reembolso total", v: formatCOP(abonado) },
                    ]}
                    aviso="Registra el reembolso y notifica al huésped. Ejecuta la devolución en la pasarela por separado."
                    confirmar="Registrar reembolso total"
                    hidden={{ codigo: b.codigo, monto: String(abonado) }}
                  />
                )}
              </div>
            )}
          </Panel>

          {w && (
            <Panel title="Nota interna">
              <form action={agregarNota} className="space-y-2">
                <input type="hidden" name="codigo" value={b.codigo} />
                <textarea
                  name="nota"
                  rows={3}
                  className="w-full rounded-sm border border-hairline p-2 text-[12px]"
                  placeholder="Solo visible para el equipo…"
                />
                <Button type="submit" variant="outline" size="sm">
                  Guardar nota
                </Button>
              </form>
              {b.notasInternas && (
                <pre className="mt-3 whitespace-pre-wrap rounded-md bg-marfil p-3 text-[11.5px] text-ink-2">
                  {b.notasInternas}
                </pre>
              )}
            </Panel>
          )}

          <Panel title="Estado de limpieza">
            <Pill tone={b.estadoLimpieza === "lista" ? "exito" : "aviso"}>{b.estadoLimpieza}</Pill>
          </Panel>
        </aside>
      </div>
    </>
  );
}
