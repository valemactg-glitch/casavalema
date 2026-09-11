import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { BrandLogo } from "@/components/site/BrandLogo";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Acceso · Portal Valema",
  robots: { index: false, follow: false },
};

export default async function LoginPage(props: PageProps<"/admin/login">) {
  const sp = await props.searchParams;
  const user = await getCurrentUser();
  if (user) redirect("/admin");

  const volver = typeof sp.volver === "string" ? sp.volver : undefined;
  const motivo = typeof sp.motivo === "string" ? sp.motivo : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-carbon px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-lg bg-white p-6 shadow-floating">
          <div className="mx-auto mb-4 max-w-[220px] overflow-hidden rounded-md">
            <BrandLogo variant="full" href={null} />
          </div>
          <h1 className="text-[20px]">Inicia sesión</h1>
          <p className="mt-1 text-[12.5px] text-ink-3">Portal administrativo de Casa Turística Valema.</p>
          {motivo === "expirada" && (
            <p className="mt-3 rounded-md bg-pendiente-bg px-3 py-2 text-[12px] text-pendiente-fg">
              Tu sesión venció por inactividad. Vuelve a iniciar sesión.
            </p>
          )}
          <div className="mt-5">
            <LoginForm volver={volver} />
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-marfil/50">
          Acceso restringido. Toda la actividad queda registrada.
        </p>
      </div>
    </div>
  );
}
