"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { crearUsuario, type UsuarioState } from "@/app/admin/(panel)/usuarios/actions";
import { ROLES } from "@/lib/auth/rbac";

const initial: UsuarioState = {};

export function UsuarioCrearForm() {
  const [state, action, pending] = useActionState(crearUsuario, initial);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-2">
      {state.ok && <p className="rounded-md bg-exito-bg px-3 py-2 text-[12px] text-exito-fg sm:col-span-2">Usuario creado.</p>}
      {state.error && <p className="rounded-md bg-error-soft-bg px-3 py-2 text-[12px] text-error-fg sm:col-span-2">{state.error}</p>}
      <input name="nombre" placeholder="Nombre" required className="rounded-sm border border-hairline px-2 py-1.5 text-[12px]" />
      <input name="email" type="email" placeholder="Correo" required className="rounded-sm border border-hairline px-2 py-1.5 text-[12px]" />
      <select name="rol" className="rounded-sm border border-hairline px-2 py-1.5 text-[12px]">
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <input name="password" type="password" placeholder="Contraseña inicial (8+)" required className="rounded-sm border border-hairline px-2 py-1.5 text-[12px]" />
      <div className="sm:col-span-2">
        <Button type="submit" variant="primary" size="sm" loading={pending}>
          Crear usuario
        </Button>
      </div>
    </form>
  );
}
