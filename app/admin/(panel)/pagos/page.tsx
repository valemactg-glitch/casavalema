import Link from "next/link";
import { AdminHeader, Panel, KpiCard, Table, Th, Td, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { formatCOP } from "@/lib/format";
import { formatDateLongEs } from "@/lib/dates";
import { PAGO_LABEL } from "@/lib/admin/estados";
import { aprobarTransferencia, rechazarTransferencia } from "./actions";

export default async function PagosPage(props: PageProps<"/admin/pagos">) {
  const user = await requireUser("pagos");
  const w = can(user.rol, "pagos", "write");
  const sp = await props.searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const now = new Date();
  const inicioMes = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [ingresos, porCobrar, transferencias, transacciones, total] = await Promise.all([
    db.payment.aggregate({ where: { estado: "APROBADO", valor: { gt: 0 }, createdAt: { gte: inicioMes } }, _sum: { valor: true } }),
    db.booking.aggregate({ where: { estado: { in: ["CONFIRMADA", "PAGO_PARCIAL"] }, saldo: { gt: 0 } }, _sum: { saldo: true }, _count: true }),
    db.payment.findMany({
      where: { metodo: "TRANSFERENCIA", estado: "PENDIENTE" },
      include: { booking: { include: { guest: { select: { nombre: true, apellidos: true } }, room: { select: { nombre: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    db.payment.findMany({
      include: { booking: { select: { codigo: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 25,
      take: 25,
    }),
    db.payment.count(),
  ]);

  const pages = Math.ceil(total / 25);

  return (
    <>
      <AdminHeader title="Pagos y reembolsos" subtitle={`Datos al ${formatDateLongEs(now)}`} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Ingresos del mes" value={formatCOP(ingresos._sum.valor ?? 0)} />
        <KpiCard label="Por cobrar" value={formatCOP(porCobrar._sum.saldo ?? 0)} hint={`${porCobrar._count} reservas`} tone="warn" />
        <KpiCard label="Transferencias por verificar" value={transferencias.length} tone={transferencias.length ? "warn" : "default"} />
        <KpiCard label="Transacciones" value={total} />
      </div>

      {transferencias.length > 0 && (
        <Panel title="Transferencias por verificar" className="mt-4">
          <ul className="space-y-3">
            {transferencias.map((t) => (
              <li key={t.id} className="rounded-md border border-hairline bg-marfil p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-medium text-carbon">
                      <Link href={`/admin/reservas/${t.booking.codigo}`} className="hover:text-oro-texto">
                        {t.booking.codigo}
                      </Link>{" "}
                      · {t.booking.guest.nombre} {t.booking.guest.apellidos} · {t.booking.room.nombre}
                    </p>
                    <p className="text-[11.5px] text-ink-3">
                      {formatCOP(t.valor)} · ref {t.referencia} · {formatDateLongEs(t.createdAt)}
                    </p>
                  </div>
                  {w && (
                    <div className="flex gap-2">
                      <form action={aprobarTransferencia}>
                        <input type="hidden" name="id" value={t.id} />
                        <Button type="submit" variant="primary" size="sm">
                          Aprobar
                        </Button>
                      </form>
                      <form action={rechazarTransferencia}>
                        <input type="hidden" name="id" value={t.id} />
                        <Button type="submit" variant="outline" size="sm">
                          Rechazar
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
                {t.comprobanteUrl ? (
                  <a href={t.comprobanteUrl} className="mt-1 inline-block text-[11px] underline">
                    Ver comprobante
                  </a>
                ) : (
                  <p className="mt-1 text-[11px] text-ink-3">
                    Sin comprobante adjunto. Pídelo por WhatsApp con el código de reserva.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Todas las transacciones" className="mt-4">
        <Table className="min-w-[620px]">
          <thead>
            <tr>
              <Th>Referencia</Th>
              <Th>Reserva</Th>
              <Th>Método</Th>
              <Th>Estado</Th>
              <Th>Fecha</Th>
              <Th className="text-right">Valor</Th>
              <Th className="text-right">Comisión</Th>
            </tr>
          </thead>
          <tbody>
            {transacciones.map((p) => (
              <tr key={p.id}>
                <Td className="font-mono text-[11px]">{p.referencia}</Td>
                <Td>
                  <Link href={`/admin/reservas/${p.booking.codigo}`} className="hover:text-oro-texto">
                    {p.booking.codigo}
                  </Link>
                </Td>
                <Td>{p.metodo}</Td>
                <Td>
                  <Pill tone={PAGO_LABEL[p.estado]?.tone ?? "neutro"}>{PAGO_LABEL[p.estado]?.label ?? p.estado}</Pill>
                </Td>
                <Td>{formatDateLongEs(p.createdAt)}</Td>
                <Td className="text-right font-medium">{formatCOP(p.valor)}</Td>
                <Td className="text-right text-ink-3">{p.comision ? formatCOP(p.comision) : "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {pages > 1 && (
          <div className="mt-3 flex justify-end gap-2 text-[12px]">
            {page > 1 && (
              <Link href={`?page=${page - 1}`} className="rounded-md border border-hairline px-2.5 py-1">
                ← Anterior
              </Link>
            )}
            {page < pages && (
              <Link href={`?page=${page + 1}`} className="rounded-md border border-hairline px-2.5 py-1">
                Siguiente →
              </Link>
            )}
          </div>
        )}
      </Panel>

      <p className="mt-4 text-[11px] text-ink-3">
        Los reembolsos se registran desde la reserva. Conciliación básica: suma de pagos
        aprobados menos reembolsos.
      </p>
    </>
  );
}
