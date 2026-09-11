"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { editarMasivo, type BulkState } from "@/app/admin/(panel)/tarifas/actions";

const initial: BulkState = {};
const DIAS = [
  ["1", "Lun"], ["2", "Mar"], ["3", "Mié"], ["4", "Jue"], ["5", "Vie"], ["6", "Sáb"], ["0", "Dom"],
];

export function BulkRateForm({ rooms }: { rooms: { id: string; nombre: string }[] }) {
  const [state, action, pending] = useActionState(editarMasivo, initial);

  return (
    <form action={action} className="space-y-3">
      {state.ok != null && (
        <p className="rounded-md bg-exito-bg px-3 py-2 text-[12px] text-exito-fg">
          Actualizadas {state.ok} noches.
        </p>
      )}
      {state.error && (
        <p className="rounded-md bg-error-soft-bg px-3 py-2 text-[12px] text-error-fg">{state.error}</p>
      )}

      <fieldset>
        <legend className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Habitaciones</legend>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {rooms.map((r) => (
            <label key={r.id} className="flex items-center gap-1.5 rounded-pill border border-hairline px-2.5 py-1 text-[12px]">
              <input type="checkbox" name="rooms" value={r.id} className="accent-carbon" />
              {r.nombre}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-[11px] font-medium text-ink-2">
          Desde
          <input type="date" name="desde" required className="mt-1 block h-9 w-full rounded-sm border border-hairline px-2 text-[12px]" />
        </label>
        <label className="text-[11px] font-medium text-ink-2">
          Hasta
          <input type="date" name="hasta" required className="mt-1 block h-9 w-full rounded-sm border border-hairline px-2 text-[12px]" />
        </label>
      </div>

      <fieldset>
        <legend className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
          Días de la semana (vacío = todos)
        </legend>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {DIAS.map(([v, l]) => (
            <label key={v} className="flex items-center gap-1.5 rounded-pill border border-hairline px-2.5 py-1 text-[12px]">
              <input type="checkbox" name="dias" value={v} className="accent-carbon" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-[11px] font-medium text-ink-2">
          Precio / noche (COP)
          <input name="precio" type="number" min={0} placeholder="sin cambio" className="mt-1 block h-9 w-full rounded-sm border border-hairline px-2 text-[12px]" />
        </label>
        <label className="text-[11px] font-medium text-ink-2">
          Estadía mínima
          <input name="estadiaMin" type="number" min={1} placeholder="sin cambio" className="mt-1 block h-9 w-full rounded-sm border border-hairline px-2 text-[12px]" />
        </label>
        <label className="text-[11px] font-medium text-ink-2">
          Inventario
          <select name="cerrado" className="mt-1 block h-9 w-full rounded-sm border border-hairline px-2 text-[12px]">
            <option value="">Sin cambio</option>
            <option value="abrir">Abrir a la venta</option>
            <option value="cerrar">Cerrar (no reservable)</option>
          </select>
        </label>
      </div>

      <Button type="submit" variant="primary" size="sm" loading={pending}>
        Aplicar a todas esas noches
      </Button>
    </form>
  );
}
