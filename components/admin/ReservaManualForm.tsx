"use client";

import { useActionState } from "react";
import { Field, SelectField, TextareaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { crearReservaManual, type ManualState } from "@/app/admin/(panel)/reservas/actions";

const initial: ManualState = {};

export function ReservaManualForm({ rooms }: { rooms: { id: string; nombre: string }[] }) {
  const [state, action, pending] = useActionState(crearReservaManual, initial);

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-md bg-error-soft-bg px-3 py-2 text-[12px] text-error-fg">
          {state.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField name="roomId" label="Habitación" required>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </SelectField>
        <SelectField name="canal" label="Canal" defaultValue="TELEFONO">
          <option value="TELEFONO">Teléfono</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="DIRECTO">Directo</option>
          <option value="AIRBNB">Airbnb</option>
        </SelectField>
        <Field name="llegada" label="Llegada" type="date" required />
        <Field name="salida" label="Salida" type="date" required />
        <SelectField name="adultos" label="Adultos" defaultValue="2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </SelectField>
        <SelectField name="ninos" label="Niños" defaultValue="0">
          {[0, 1, 2, 3, 4].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </SelectField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="nombre" label="Nombre del titular" required />
        <Field name="apellidos" label="Apellidos" required />
        <Field name="telefono" label="Teléfono" type="tel" required />
        <Field name="correo" label="Correo" type="email" required />
      </div>
      <SelectField name="estado" label="Estado inicial" defaultValue="PENDIENTE_PAGO">
        <option value="PENDIENTE_PAGO">Pendiente de pago</option>
        <option value="CONFIRMADA">Confirmada (pago fuera de línea)</option>
      </SelectField>
      <TextareaField name="notas" label="Notas internas (opcional)" rows={2} />
      <Button type="submit" variant="primary" size="lg" loading={pending}>
        Crear reserva
      </Button>
    </form>
  );
}
