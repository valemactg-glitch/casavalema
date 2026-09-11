import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireUser } from "@/lib/auth/session";
import { accessibleModules } from "@/lib/auth/rbac";

export const metadata: Metadata = {
  title: { default: "Portal Valema", template: "%s · Portal Valema" },
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();
  return (
    <AdminShell
      user={{ nombre: user.nombre, rol: user.rol }}
      modulos={accessibleModules(user.rol)}
    >
      {children}
    </AdminShell>
  );
}
