"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, SelectField, TextareaField, CheckboxField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { formatCOP } from "@/lib/format";
import {
  actualizarContacto,
  agregarAcompanante,
  crearSolicitud,
  dejarResena,
  type ActionState,
} from "@/app/(booking)/mi-reserva/[token]/actions";

const initial: ActionState = { ok: false };

function Feedback({ state }: { state: ActionState }) {
  if (state.error) return <Callout tone="error" role="alert">{state.error}</Callout>;
  if (state.ok && state.message) return <Callout tone="exito" role="status">{state.message}</Callout>;
  return null;
}

export function ContactUpdateForm({
  token,
  telefono,
  correo,
  horaLlegada,
}: {
  token: string;
  telefono: string;
  correo: string;
  horaLlegada: string | null;
}) {
  const [state, action, pending] = useActionState(actualizarContacto, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <Feedback state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="telefono" label="Teléfono" type="tel" defaultValue={telefono} required />
        <Field name="correo" label="Correo" type="email" defaultValue={correo} required />
      </div>
      <Field name="horaLlegada" label="Hora aproximada de llegada" type="time" defaultValue={horaLlegada ?? ""} />
      <Button type="submit" size="sm" variant="primary" loading={pending}>
        Guardar cambios
      </Button>
    </form>
  );
}

export function CompanionForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(agregarAcompanante, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <Feedback state={state} />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Field name="nombre" label="Nombre del acompañante" required />
        <Field name="edad" label="Edad (si es menor)" type="number" min={0} max={17} className="w-24" />
        <div className="flex items-end pb-1">
          <CheckboxField name="esMenor" label="Es menor de edad" />
        </div>
      </div>
      <Button type="submit" size="sm" variant="outline" loading={pending}>
        Agregar acompañante
      </Button>
    </form>
  );
}

export function RequestForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(crearSolicitud, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <Feedback state={state} />
      <SelectField name="tipo" label="Tipo de solicitud" defaultValue="FECHAS">
        <option value="FECHAS">Cambio de fechas</option>
        <option value="SERVICIOS">Agregar servicios</option>
        <option value="CANCELACION">Cancelación</option>
        <option value="OTRO">Otra</option>
      </SelectField>
      <TextareaField
        name="detalle"
        label="Cuéntanos"
        rows={3}
        required
        placeholder="Nuevas fechas propuestas, motivo, servicio que quieres…"
      />
      <p className="text-[11.5px] text-ink-3">
        Las solicitudes que no cumplen la política no se aprueban solas: quedan pendientes
        de revisión y te contactamos.
      </p>
      <Button type="submit" size="sm" variant="outline" loading={pending}>
        Enviar solicitud
      </Button>
    </form>
  );
}

function StarInput({ name, label }: { name: string; label: string }) {
  const [v, setV] = useState(5);
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12.5px] text-ink-2">{label}</span>
      <input type="hidden" name={name} value={v} />
      <span className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setV(n)}
            aria-label={`${n} de 5`}
            className={n <= v ? "text-oro" : "text-ink-muted"}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 15l-5.3 2.8 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
            </svg>
          </button>
        ))}
      </span>
    </div>
  );
}

export function ReviewForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(dejarResena, initial);
  if (state.ok) return <Feedback state={state} />;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <Feedback state={state} />
      <Field name="autor" label="Nombre o iniciales" required />
      <div className="space-y-1.5 rounded-md bg-marfil p-3">
        <StarInput name="limpieza" label="Limpieza" />
        <StarInput name="ubicacion" label="Ubicación" />
        <StarInput name="atencion" label="Atención" />
        <StarInput name="comodidad" label="Comodidad" />
        <StarInput name="precio" label="Relación calidad-precio" />
      </div>
      <TextareaField name="texto" label="Tu experiencia" rows={4} required />
      <Button type="submit" size="sm" variant="primary" loading={pending}>
        Enviar reseña
      </Button>
    </form>
  );
}

export function PayPendingPanel({
  bookingId,
  codigo,
  saldo,
  anticipoPendiente,
  reembolsable,
}: {
  bookingId: string;
  codigo: string;
  saldo: number;
  anticipoPendiente: number;
  reembolsable: boolean;
}) {
  const router = useRouter();
  const [metodo, setMetodo] = useState<"TARJETA" | "PSE" | "TRANSFERENCIA">("TARJETA");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalidad: "anticipo" | "total" = anticipoPendiente > 0 ? "anticipo" : "total";
  const monto = anticipoPendiente > 0 ? anticipoPendiente : saldo;

  async function pagar() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/payments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ metodo, modalidad }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message ?? "No se pudo procesar el pago.");
        return;
      }
      router.refresh();
      router.push(
        `/reserva/${codigo}?ref=${data.referencia}&estado=${
          data.estado === "APROBADO" ? "aprobado" : data.estado === "PENDIENTE" ? "pendiente" : "rechazado"
        }`,
      );
    } catch {
      setError("Problema de conexión.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <Callout tone="error" role="alert">{error}</Callout>}
      <p className="text-[13px] text-ink-2">
        {anticipoPendiente > 0
          ? `Falta el anticipo de ${formatCOP(anticipoPendiente)} para asegurar la reserva.`
          : `Puedes adelantar el saldo de ${formatCOP(saldo)} o pagarlo al llegar.`}
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ["TARJETA", "Tarjeta"],
          ["PSE", "PSE"],
          ["TRANSFERENCIA", "Transferencia"],
        ].map(([v, t]) => (
          <label
            key={v}
            className={
              "cursor-pointer rounded-md border p-2.5 text-center text-[12.5px] " +
              (metodo === v ? "border-oro bg-oro/[0.06]" : "border-hairline")
            }
          >
            <input
              type="radio"
              name="metodo-portal"
              className="sr-only"
              checked={metodo === v}
              onChange={() => setMetodo(v as typeof metodo)}
            />
            {t}
          </label>
        ))}
      </div>
      <Button onClick={pagar} loading={busy} variant="primary" size="sm">
        {metodo === "TRANSFERENCIA" ? "Registrar transferencia" : `Pagar ${formatCOP(monto)}`}
      </Button>
      {!reembolsable && (
        <p className="text-[11px] text-ink-3">Tarifa no reembolsable: el pago no admite devolución.</p>
      )}
    </div>
  );
}
