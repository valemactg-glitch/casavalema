"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { MAIN_NAV } from "@/lib/nav";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/Button";

export function Header() {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);

  useEffect(() => {
    // Cerrar el menú móvil al navegar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = !overHero || scrolled;

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        solid
          ? "bg-marfil/95 shadow-header backdrop-blur-sm"
          : "bg-gradient-to-b from-carbon/70 via-carbon/25 to-transparent",
      )}
    >
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Logo tone={solid ? "dark" : "light"} />

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Principal">
          {MAIN_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "text-[12.5px] font-medium transition-colors",
                  solid
                    ? active
                      ? "text-carbon underline decoration-oro decoration-2 underline-offset-[6px]"
                      : "text-ink-2 hover:text-carbon"
                    : active
                      ? "text-marfil underline decoration-oro decoration-2 underline-offset-[6px] [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]"
                      : "text-marfil hover:text-oro [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <LangToggle solid={solid} />
          <Button href="/reservar" variant="gold" size="sm" className="hidden sm:inline-flex">
            Reservar ahora
          </Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className={clsx(
              "grid size-10 place-items-center rounded-pill lg:hidden",
              solid ? "text-carbon" : "text-marfil",
            )}
          >
            <span className="relative block h-3.5 w-5">
              <span
                className={clsx(
                  "absolute left-0 h-0.5 w-5 bg-current transition-transform",
                  open ? "top-1.5 rotate-45" : "top-0",
                )}
              />
              <span
                className={clsx(
                  "absolute left-0 top-1.5 h-0.5 w-5 bg-current transition-opacity",
                  open && "opacity-0",
                )}
              />
              <span
                className={clsx(
                  "absolute left-0 h-0.5 w-5 bg-current transition-transform",
                  open ? "top-1.5 -rotate-45" : "top-3",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div id="menu-movil" className="fixed inset-0 top-16 z-40 bg-marfil lg:hidden">
          <nav className="shell flex flex-col gap-1 py-6" aria-label="Principal (móvil)">
            <Link href="/" className="border-b border-hairline py-3 text-[15px] font-medium text-carbon">
              Inicio
            </Link>
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-hairline py-3 text-[15px] font-medium text-carbon"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-5">
              <Button href="/reservar" variant="gold" fullWidth size="lg">
                Reservar ahora
              </Button>
            </div>
            <Link href="/mi-reserva" className="pt-4 text-center text-[13px] text-ink-2 underline">
              Consultar mi reserva
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function LangToggle({ solid }: { solid: boolean }) {
  return (
    <span
      className={clsx(
        "hidden items-center gap-1 text-[11px] font-semibold tracking-[0.1em] sm:inline-flex",
        solid ? "text-ink-3" : "text-marfil/70",
      )}
      title="El sitio en inglés estará disponible pronto"
    >
      <span className={solid ? "text-carbon" : "text-marfil"}>ES</span>
      <span aria-hidden="true">·</span>
      <span className="opacity-60">EN</span>
    </span>
  );
}
