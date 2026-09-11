import { AdminHeader, Panel, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { formatDateEs, formatDateLongEs } from "@/lib/dates";
import { aprobarResena, rechazarResena, ocultarResena, destacarResena, responderResena } from "./actions";

const CATS = [
  ["limpieza", "Limpieza"],
  ["ubicacion", "Ubicación"],
  ["atencion", "Atención"],
  ["comodidad", "Comodidad"],
  ["precio", "Relación calidad-precio"],
] as const;

const ESTADO_TONE: Record<string, "exito" | "pendiente" | "error" | "neutro"> = {
  PUBLICADA: "exito",
  PENDIENTE: "pendiente",
  RECHAZADA: "error",
  SIN_VALIDAR: "error",
};

export default async function ResenasAdminPage() {
  const user = await requireUser("resenas");
  const w = can(user.rol, "resenas", "write");
  const reviews = await db.review.findMany({
    include: { room: { select: { nombre: true } }, booking: { select: { codigo: true } } },
    orderBy: { createdAt: "desc" },
  });

  const publicadas = reviews.filter((r) => r.estado === "PUBLICADA");
  const promedio = (k: (typeof CATS)[number][0]) =>
    publicadas.length ? publicadas.reduce((s, r) => s + r[k], 0) / publicadas.length : 0;
  const cola = reviews.filter((r) => r.estado !== "RECHAZADA");

  return (
    <>
      <AdminHeader title="Reseñas" subtitle={`${publicadas.length} publicadas · ${reviews.filter((r) => r.estado === "PENDIENTE").length} por aprobar`} />

      <Panel title="Puntajes por categoría" className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {CATS.map(([k, label]) => {
            const v = promedio(k);
            return (
              <div key={k}>
                <p className="text-[11px] text-ink-3">{label}</p>
                <p className="font-heading text-[20px] text-carbon">{v.toFixed(1).replace(".", ",")}</p>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-pill bg-neutro-bg">
                  <span className="block h-full rounded-pill bg-oro" style={{ width: `${(v / 5) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Cola de moderación" padded={false}>
        <ul className="divide-y divide-hairline">
          {cola.map((r) => {
            const avg = (r.limpieza + r.ubicacion + r.atencion + r.comodidad + r.precio) / 5;
            return (
              <li key={r.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-[13px] font-medium text-carbon">
                      {r.autor}
                      <StarRating value={avg} size={12} />
                      {r.destacada && <Pill tone="exito">Destacada</Pill>}
                    </p>
                    <p className="text-[11px] text-ink-3">
                      {r.room?.nombre ?? "Casa Valema"}
                      {r.booking ? ` · ${r.booking.codigo}` : " · sin reserva asociada"}
                      {r.fechaEstadia ? ` · ${formatDateEs(r.fechaEstadia, { weekday: false })}` : ""} ·{" "}
                      {formatDateLongEs(r.createdAt)}
                    </p>
                  </div>
                  <Pill tone={ESTADO_TONE[r.estado]}>{r.estado.replace("_", " ").toLowerCase()}</Pill>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">{r.texto}</p>

                {!r.booking && (
                  <p className="mt-2 rounded-md bg-error-soft-bg px-3 py-1.5 text-[11.5px] text-error-fg">
                    Sin reserva asociada: el sistema no permite publicarla. Puede aprobarse
                    manualmente sólo si se confirma la estadía.
                  </p>
                )}

                {r.respuesta && (
                  <p className="mt-2 rounded-md bg-marfil px-3 py-2 text-[11.5px] text-ink-2">
                    <span className="font-medium">Respuesta:</span> {r.respuesta}
                  </p>
                )}

                {w && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {r.estado !== "PUBLICADA" && (
                      <form action={aprobarResena}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button type="submit" variant="primary" size="sm">
                          Aprobar y publicar
                        </Button>
                      </form>
                    )}
                    {r.estado === "PUBLICADA" && (
                      <form action={ocultarResena}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button type="submit" variant="outline" size="sm">
                          Ocultar
                        </Button>
                      </form>
                    )}
                    <form action={rechazarResena}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Rechazar
                      </Button>
                    </form>
                    <form action={destacarResena}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        {r.destacada ? "Quitar destacado" : "Destacar"}
                      </Button>
                    </form>
                    <form action={responderResena} className="flex flex-1 gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <input
                        name="respuesta"
                        defaultValue={r.respuesta ?? ""}
                        placeholder="Responder públicamente…"
                        className="h-8 min-w-[160px] flex-1 rounded-sm border border-hairline px-2 text-[11.5px]"
                      />
                      <Button type="submit" variant="outline" size="sm">
                        Responder
                      </Button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
