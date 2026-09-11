import Link from "next/link";
import { AdminHeader, Panel, Table, Th, Td, Pill, EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { formatCOP } from "@/lib/format";
import { formatRangeEs } from "@/lib/dates";
import { ESTADO_LABEL, CANAL_LABEL } from "@/lib/admin/estados";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 20;
const ESTADOS = Object.keys(ESTADO_LABEL);

export default async function ReservasPage(props: PageProps<"/admin/reservas">) {
  const user = await requireUser("reservas");
  const sp = await props.searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const estado = typeof sp.estado === "string" ? sp.estado : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.BookingWhereInput = {
    ...(estado ? { estado: estado as never } : {}),
    ...(q
      ? {
          OR: [
            { codigo: { contains: q, mode: "insensitive" } },
            { guest: { apellidos: { contains: q, mode: "insensitive" } } },
            { guest: { nombre: { contains: q, mode: "insensitive" } } },
            { guest: { correo: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.booking.findMany({
      where,
      include: { room: { select: { nombre: true } }, guest: { select: { nombre: true, apellidos: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.booking.count({ where }),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);
  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (estado) p.set("estado", estado);
    for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
    return `?${p.toString()}`;
  };

  return (
    <>
      <AdminHeader
        title="Reservas"
        subtitle={`${total} reserva${total === 1 ? "" : "s"}`}
        actions={
          can(user.rol, "reservas", "write") && (
            <Button href="/admin/reservas/nueva" variant="primary" size="sm">
              Nueva reserva
            </Button>
          )
        }
      />

      <Panel padded={false}>
        <form className="flex flex-wrap gap-2 border-b border-hairline p-3" method="get">
          <input
            name="q"
            defaultValue={q}
            placeholder="Código, apellido o correo…"
            className="h-9 min-w-[200px] flex-1 rounded-sm border border-hairline px-3 text-[12.5px]"
          />
          <select name="estado" defaultValue={estado} className="h-9 rounded-sm border border-hairline px-2 text-[12px]">
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ESTADO_LABEL[e].label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filtrar
          </Button>
        </form>

        <div className="p-3">
          {rows.length === 0 ? (
            <EmptyState title="Sin reservas">Ajusta el buscador o los filtros.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Código</Th>
                  <Th>Huésped · habitación</Th>
                  <Th>Fechas</Th>
                  <Th>Canal</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id}>
                    <Td>
                      <Link href={`/admin/reservas/${b.codigo}`} className="font-medium hover:text-oro-texto">
                        {b.codigo}
                      </Link>
                    </Td>
                    <Td>
                      {b.guest.nombre} {b.guest.apellidos}
                      <span className="block text-[11px] text-ink-3">{b.room.nombre}</span>
                    </Td>
                    <Td>
                      {formatRangeEs(b.llegada, b.salida)}
                      <span className="block text-[11px] text-ink-3">{b.noches} noches</span>
                    </Td>
                    <Td>{CANAL_LABEL[b.canal]}</Td>
                    <Td>
                      <Pill tone={ESTADO_LABEL[b.estado].tone}>{ESTADO_LABEL[b.estado].label}</Pill>
                    </Td>
                    <Td className="text-right font-medium">{formatCOP(b.total)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-[12px] text-ink-3">
              <span>
                Página {page} de {pages}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={qs({ page: page - 1 })} className="rounded-md border border-hairline px-2.5 py-1 hover:bg-marfil">
                    ← Anterior
                  </Link>
                )}
                {page < pages && (
                  <Link href={qs({ page: page + 1 })} className="rounded-md border border-hairline px-2.5 py-1 hover:bg-marfil">
                    Siguiente →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </Panel>
    </>
  );
}
