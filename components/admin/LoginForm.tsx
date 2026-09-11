"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/login/actions";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initial: LoginState = {};

export function LoginForm({ volver }: { volver?: string }) {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="volver" value={volver ?? ""} />
      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-bugambilia bg-error-soft-bg px-3.5 py-2.5 text-[12.5px] text-error-fg"
        >
          {state.error}
          {state.intentosRestantes != null && state.intentosRestantes > 0 && (
            <span className="block text-[11.5px]">
              Te quedan {state.intentosRestantes} intento{state.intentosRestantes === 1 ? "" : "s"}.
            </span>
          )}
        </div>
      )}
      <Field name="email" label="Correo" type="email" required autoComplete="username" autoFocus />
      <Field name="password" label="Contraseña" type="password" required autoComplete="current-password" />
      <Button type="submit" variant="primary" size="lg" fullWidth loading={pending}>
        Entrar
      </Button>
      <div className="flex justify-between text-[12px] text-ink-3">
        <a href="/admin/recuperar" className="hover:text-carbon">
          Recuperar contraseña
        </a>
        <Link href="/" className="hover:text-carbon">
          Ir al sitio
        </Link>
      </div>
    </form>
  );
}
