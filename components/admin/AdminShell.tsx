"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { ADMIN_NAV } from "@/lib/admin/nav";
import { BrandMark } from "@/components/site/BrandLogo";

export function AdminShell({
  user,
  modulos,
  children,
}: {
  user: { nombre: string; rol: string };
  modulos: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  const items = ADMIN_NAV.filter((i) => modulos.includes(i.modulo));

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-panel lg:grid lg:grid-cols-[212px_1fr]">
      {/* Barra superior móvil */}
      <div className="flex items-center justify-between border-b border-hairline bg-carbon px-4 py-3 text-marfil lg:hidden">
        <Link href="/" className="flex items-center gap-2.5" title="Ir al sitio web">
          <BrandMark size={30} />
          <span className="font-heading text-[16px] transition-colors hover:text-oro">Valema</span>
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rounded-md border border-marfil/20 px-3 py-1 text-[12px]"
        >
          {open ? "Cerrar" : "Menú"}
        </button>
      </div>

      {/* Barra lateral */}
      <aside
        className={clsx(
          "z-40 flex flex-col bg-carbon text-marfil",
          "lg:sticky lg:top-0 lg:h-screen",
          open ? "block" : "hidden lg:flex",
        )}
      >
        <Link
          href="/"
          title="Ir al sitio web"
          className="group hidden items-center gap-2.5 px-5 py-5 lg:flex"
        >
          <BrandMark size={36} />
          <span className="inline-flex flex-col leading-none">
            <span className="font-heading text-[18px] text-marfil transition-colors group-hover:text-oro">
              Valema
            </span>
            <span className="mt-0.5 text-[8.5px] font-semibold uppercase tracking-[0.24em] text-oro">
              Portal
            </span>
          </span>
        </Link>
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Portal administrativo">
          {items.map((i) => {
            const active = isActive(i.href);
            return (
              <Link
                key={i.href}
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "block border-l-[3px] px-5 py-2.5 text-[12.5px] transition-colors",
                  active
                    ? "border-oro bg-[rgba(212,175,55,0.18)] font-semibold text-marfil"
                    : "border-transparent text-[#c9cdd3] hover:bg-white/10 hover:text-marfil",
                )}
              >
                {i.label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-marfil/12 px-5 py-3.5 text-[11.5px] leading-relaxed">
          <p className="font-medium text-marfil">{user.nombre}</p>
          <p className="capitalize text-marfil/55">{user.rol.replace("_", " ").toLowerCase()}</p>
          <Link href="/admin/logout" className="mt-1 inline-block text-marfil/75 underline hover:text-marfil">
            Cerrar sesión
          </Link>
        </div>
      </aside>

      {/* Contenido */}
      <main className="min-w-0 px-5 py-6 sm:px-8 sm:pb-16">{children}</main>
    </div>
  );
}
