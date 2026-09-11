import { AdminHeader, Panel, Pill, EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { formatDateLongEs } from "@/lib/dates";
import { NOTIFICATIONS, buildEmail } from "@/lib/email/templates";
import { addDays, today } from "@/lib/dates";
import { marcarGestionado, guardarPlantilla } from "./actions";

const SAMPLE = {
  nombre: "Ana María",
  codigo: "VAL-26-0184",
  habitacion: "Magdalena",
  llegada: addDays(today(), 20),
  salida: addDays(today(), 22),
  noches: 2,
  huespedes: "2 adultos",
  total: 668000,
  anticipo: 200400,
  saldo: 467600,
  gestionUrl: "https://valema.co/mi-reserva/ejemplo",
};

export default async function MensajesPage() {
  const user = await requireUser("mensajes");
  const w = can(user.rol, "mensajes", "write");
  const [mensajes, plantillas] = await Promise.all([
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    db.emailTemplate.findMany(),
  ]);
  const overrides = new Map(plantillas.map((p) => [p.evento, p]));

  return (
    <>
      <AdminHeader title="Mensajes y plantillas" subtitle="Formularios de contacto y plantillas de correo" />

      <Panel title="Bandeja de contacto" padded={false} className="mb-4">
        {mensajes.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Sin mensajes" />
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {mensajes.map((m) => (
              <li key={m.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-medium text-carbon">
                      {m.nombre} · <span className="font-normal text-ink-3">{m.motivo}</span>
                    </p>
                    <p className="text-[11.5px] text-ink-3">
                      {m.correo}
                      {m.telefono ? ` · ${m.telefono}` : ""} · {formatDateLongEs(m.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={m.gestionado ? "exito" : "pendiente"}>{m.gestionado ? "gestionado" : "nuevo"}</Pill>
                    {w && (
                      <form action={marcarGestionado}>
                        <input type="hidden" name="id" value={m.id} />
                        <button className="text-[11px] underline">{m.gestionado ? "Reabrir" : "Marcar gestionado"}</button>
                      </form>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">{m.mensaje}</p>
                <a
                  href={`mailto:${m.correo}?subject=Re: consulta a Casa Turística Valema`}
                  className="mt-1 inline-block text-[11.5px] underline"
                >
                  Responder por correo
                </a>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Plantillas de correo (21)">
        <p className="mb-3 text-[11.5px] text-ink-2">
          Cada plantilla se activa o desactiva por separado y declara su canal. Al editar
          asunto o cuerpo se guarda un override; sin override rige la plantilla del sistema.
        </p>
        <div className="space-y-2">
          {NOTIFICATIONS.map((n) => {
            const ov = overrides.get(n.event);
            const base = buildEmail(n.event, SAMPLE);
            return (
              <details key={n.event} className="rounded-md border border-hairline">
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[12.5px]">
                  <span>
                    <span className="font-medium text-carbon">{n.nombre}</span>{" "}
                    <span className="text-ink-3">
                      · {n.canal === "ambos" ? "correo + WhatsApp" : n.canal} · {n.destinatario}
                    </span>
                  </span>
                  {ov && !ov.activa ? (
                    <Pill tone="neutro">desactivada</Pill>
                  ) : ov ? (
                    <Pill tone="info">editada</Pill>
                  ) : (
                    <Pill tone="neutro">sistema</Pill>
                  )}
                </summary>
                <div className="border-t border-hairline p-3">
                  <p className="mb-2 text-[11px] text-ink-3">Se dispara: {n.disparador}</p>
                  {w ? (
                    <form action={guardarPlantilla} className="space-y-2">
                      <input type="hidden" name="evento" value={n.event} />
                      <input
                        name="asunto"
                        defaultValue={ov?.asunto ?? base.subject}
                        className="w-full rounded-sm border border-hairline px-2 py-1.5 text-[12px]"
                      />
                      <textarea
                        name="cuerpo"
                        defaultValue={ov?.cuerpo ?? base.text}
                        rows={5}
                        className="w-full rounded-sm border border-hairline p-2 text-[11.5px]"
                      />
                      <label className="flex items-center gap-2 text-[12px]">
                        <input type="checkbox" name="activa" defaultChecked={ov?.activa ?? true} className="accent-carbon" /> Activa
                      </label>
                      <Button type="submit" variant="outline" size="sm">
                        Guardar plantilla
                      </Button>
                    </form>
                  ) : (
                    <pre className="whitespace-pre-wrap rounded-md bg-marfil p-2 text-[11px] text-ink-2">
                      {ov?.cuerpo ?? base.text}
                    </pre>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </Panel>
    </>
  );
}
