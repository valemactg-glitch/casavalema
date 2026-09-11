import { AdminHeader, Panel } from "@/components/admin/ui";
import { ReservaManualForm } from "@/components/admin/ReservaManualForm";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function NuevaReservaPage() {
  await requireUser("reservas", "write");
  const rooms = await db.room.findMany({ orderBy: { orden: "asc" }, select: { id: true, nombre: true } });

  return (
    <>
      <AdminHeader
        title="Nueva reserva"
        subtitle="Reserva creada por el equipo (teléfono, WhatsApp o traspaso de Airbnb)"
      />
      <Panel className="max-w-2xl">
        <ReservaManualForm rooms={rooms} />
        <p className="mt-4 text-[11.5px] text-ink-3">
          Se revalida la disponibilidad al guardar. Para reservas de Airbnb que ya
          existen se puede omitir esa comprobación.
        </p>
      </Panel>
    </>
  );
}
