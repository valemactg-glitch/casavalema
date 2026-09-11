import type { Metadata } from "next";
import Link from "next/link";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Recuperar contraseña · Portal Valema",
  robots: { index: false, follow: false },
};

export default function RecuperarPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-carbon px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-floating">
        <h1 className="text-[20px]">Recuperar contraseña</h1>
        <p className="mt-1 text-[12.5px] text-ink-3">
          Escribe tu correo y te enviaremos un enlace para restablecerla.
        </p>
        {/* Envío de correo pendiente (Fase 2 · integración). */}
        <form className="mt-5 space-y-4" action="/admin/recuperar">
          <Field name="email" label="Correo" type="email" required />
          <Button type="submit" variant="primary" size="lg" fullWidth>
            Enviar enlace
          </Button>
        </form>
        <p className="mt-4 text-[12px] text-ink-3">
          <Link href="/admin/login" className="hover:text-carbon">
            ← Volver al inicio de sesión
          </Link>
        </p>
        <p className="mt-3 rounded-md bg-info-bg px-3 py-2 text-[11.5px] text-info-fg">
          En esta versión el envío de correo está pendiente de integración. Para restablecer
          una contraseña, un propietario puede hacerlo desde Usuarios.
        </p>
      </div>
    </div>
  );
}
