"use client";

import { useActionState } from "react";
import { enviarContacto, type ContactState } from "@/app/(site)/contacto/actions";
import { Field, SelectField, TextareaField, CheckboxField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { MOTIVOS_CONTACTO } from "@/lib/catalog";
import Link from "next/link";

const initial: ContactState = { ok: false };

export function ContactForm() {
  const [state, action, pending] = useActionState(enviarContacto, initial);

  if (state.ok) {
    return (
      <Callout tone="exito" title="Mensaje enviado" role="status">
        Gracias por escribirnos. Te responderemos al correo que nos dejaste, normalmente el
        mismo día. Si es urgente,{" "}
        <a href="https://wa.me/573000000000">escríbenos por WhatsApp</a>.
      </Callout>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <Callout tone="error" role="alert">
          {state.error}
        </Callout>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="nombre"
          label="Nombre"
          required
          autoComplete="name"
          error={state.fieldErrors?.nombre}
        />
        <Field
          name="correo"
          label="Correo"
          type="email"
          required
          autoComplete="email"
          error={state.fieldErrors?.correo}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="telefono"
          label="Teléfono (opcional)"
          type="tel"
          autoComplete="tel"
          error={state.fieldErrors?.telefono}
        />
        <SelectField name="motivo" label="Motivo" required error={state.fieldErrors?.motivo} defaultValue="">
          <option value="" disabled>
            Elige un motivo
          </option>
          {MOTIVOS_CONTACTO.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </SelectField>
      </div>
      <TextareaField
        name="mensaje"
        label="Mensaje"
        required
        rows={5}
        placeholder="Cuéntanos fechas, número de personas o lo que necesites."
        error={state.fieldErrors?.mensaje}
      />
      <CheckboxField
        name="consentimiento"
        label={
          <>
            Autorizo a Casa Turística Valema a usar mis datos para responder esta consulta,
            según la{" "}
            <Link href="/legales/tratamiento-de-datos" className="underline">
              política de tratamiento de datos
            </Link>
            .
          </>
        }
        error={state.fieldErrors?.consentimiento}
      />
      <Button type="submit" variant="primary" size="lg" loading={pending}>
        Enviar mensaje
      </Button>
    </form>
  );
}
