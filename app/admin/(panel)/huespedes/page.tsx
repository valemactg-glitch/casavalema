import Link from "next/link";
import { AdminHeader, Panel, Table, Th, Td, EmptyState } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatCOP } from "@/lib/format";

export default async function HuespedesPage(props: PageProps<"/admin/huespedes">) {
  await requireUser("huespedes");
  const sp = await props.searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();

  const guests = await db.guest.findMany({
    where: q
      ? {
          OR: [
            { apellidos: { contains: q, mode: "insensitive" } },
            { nombre: { contains: q, mode: "insensitive" } },
            { correo: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    include: {
      bookings: { select: { total: true, estado: true, canal: true, payments: { where: { estado: "APROBADO" }, select: { valor: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <AdminHeader title="Huéspedes" subtitle={`${guests.length} registros`} />
      <Panel padded={false}>
        <form method="get" className="border-b border-hairline p-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Apellido o correo…"
            className="h-9 w-full max-w-xs rounded-sm border border-hairline px-3 text-[12.5px]"
          />
        </form>
        <div className="p-3">
          {guests.length === 0 ? (
            <EmptyState title="Sin huéspedes" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Huésped</Th>
                  <Th>Procedencia</Th>
                  <Th>Estadías</Th>
                  <Th>Canal habitual</Th>
                  <Th className="text-right">Gasto total</Th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => {
                  const gasto = g.bookings.flatMap((b) => b.payments).reduce((s, p) => s + p.valor, 0);
                  const estadias = g.bookings.filter((b) => !["CANCELADA", "BORRADOR", "NO_SHOW"].includes(b.estado)).length;
                  const canales = g.bookings.map((b) => b.canal);
                  const canal = canales.length ? canales.sort((a, b) => canales.filter((c) => c === b).length - canales.filter((c) => c === a).length)[0] : "—";
                  return (
                    <tr key={g.id}>
                      <Td>
                        <Link href={`/admin/huespedes/${g.id}`} className="font-medium hover:text-oro-texto">
                          {g.nombre} {g.apellidos}
                        </Link>
                        <span className="block text-[11px] text-ink-3">{g.correo}</span>
                      </Td>
                      <Td>{[g.ciudad, g.pais].filter(Boolean).join(", ") || "—"}</Td>
                      <Td>{estadias}</Td>
                      <Td>{canal}</Td>
                      <Td className="text-right font-medium">{formatCOP(gasto)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </div>
      </Panel>
    </>
  );
}
