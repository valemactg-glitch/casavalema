import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { ROLES } from "@/lib/auth/rbac";

export const metadata: Metadata = {
  title: "Permiso insuficiente · Portal Valema",
  robots: { index: false, follow: false },
};

export default async function SinPermisoPage() {
  const user = await requireUser();
  const rol = ROLES.find((r) => r.value === user.rol);

  return (
    <div className="flex min-h-screen items-center justify-center bg-panel px-4">
      <div className="max-w-md text-center">
        <p className="kicker">Acceso denegado</p>
        <h1 className="mt-2 text-[26px]">No tienes permiso para ver esta sección</h1>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">
          Tu rol es <strong>{rol?.label ?? user.rol}</strong> — {rol?.descripcion}. Si crees
          que necesitas acceso, pídeselo a un propietario.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button href="/admin" variant="primary">
            Volver al panel
          </Button>
          <Link href="/admin/logout" className="self-center text-[13px] text-ink-3 hover:text-carbon">
            Cerrar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
