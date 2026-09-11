"use client";

import { useActionState } from "react";
import { Field, SelectField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { previsualizarBloqueo, aplicarBloqueo, type BloqueoState } from "@/app/admin/(panel)/calendario/actions";

const initial: BloqueoState = { fase: "idle" };

export function BlockPanel({ rooms }: { rooms: { id: string; nombre: string }[] }) {
  const [state, action, pending] = useActionState(previsualizarBloqueo, initial);

  return (
    <div className="space-y-3">
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <SelectField name="roomId" label="Habitación" required>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </SelectField>
        <SelectField name="tipo" label="Tipo de bloqueo" defaultValue="MANUAL">
          <option value="MANUAL">Bloqueo manual</option>
          <option value="MANTENIMIENTO">Mantenimiento</option>
          <option value="CORTESIA">Cortesía</option>
        </SelectField>
        <Field name="desde" label="Desde" type="date" required />
        <Field name="hasta" label="Hasta (noche de salida)" type="date" required />
        <Field name="motivo" label="Motivo" wrapClassName="sm:col-span-2" placeholder="Uso de la familia, pintura…" />
        <div className="sm:col-span-2">
          <Button type="submit" variant="outline" size="sm" loading={pending}>
            Ver consecuencias
          </Button>
        </div>
      </form>

      {state.fase === "error" && (
        <p className="rounded-md bg-error-soft-bg px-3 py-2 text-[12px] text-error-fg">{state.mensaje}</p>
      )}

      {state.fase === "ok" && (
        <p className="rounded-md bg-exito-bg px-3 py-2 text-[12px] text-exito-fg">{state.mensaje}</p>
      )}

      {state.fase === "preview" && (
        <div className="rounded-md border border-hairline bg-marfil p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-oro-texto">
            Confirmar antes de aplicar
          </p>
          <h3 className="mt-1 text-[15px]">
            Bloquear {state.roomNombre}, {state.noches} noche{state.noches === 1 ? "" : "s"}
          </h3>
          <dl className="mt-3 divide-y divide-hairline text-[12.5px]">
            <div className="flex justify-between py-1.5">
              <dt className="text-ink-3">Habitación</dt>
              <dd className="font-medium">{state.roomNombre}</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-ink-3">Noches</dt>
              <dd className="font-medium">
                {state.datos.desde} → {state.datos.hasta}
              </dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-ink-3">Motivo</dt>
              <dd className="font-medium">{state.datos.motivo || "—"}</dd>
            </div>
            <div className="py-1.5">
              <dt className="text-ink-3">Reservas afectadas</dt>
              <dd className="mt-1 font-medium">
                {state.reservasAfectadas.length === 0 ? (
                  "Ninguna · esas noches están libres"
                ) : (
                  <ul className="text-error-fg">
                    {state.reservasAfectadas.map((r) => (
                      <li key={r.codigo}>
                        {r.codigo} · {r.rango}
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          </dl>
          <p className="mt-2 rounded-md bg-[#FFF9E8] px-3 py-2 text-[11.5px] text-[#8A6A0B]">
            Al aplicar, esas noches dejan de venderse en la web y se exportan a Airbnb en la
            próxima sincronización (hasta 3 horas después).
          </p>
          <form action={aplicarBloqueo} className="mt-3 flex gap-2">
            <input type="hidden" name="roomId" value={state.datos.roomId} />
            <input type="hidden" name="desde" value={state.datos.desde} />
            <input type="hidden" name="hasta" value={state.datos.hasta} />
            <input type="hidden" name="tipo" value={state.datos.tipo} />
            <input type="hidden" name="motivo" value={state.datos.motivo ?? ""} />
            <Button type="submit" variant="primary" size="sm">
              Aplicar bloqueo
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
