import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MAIN_NAV } from "@/lib/nav";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="kicker">Error 404</p>
      <h1 className="mt-2 text-[clamp(1.8rem,5vw,2.6rem)]">Esta página no existe</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-ink-2">
        Puede que el enlace esté roto o que la página se haya movido. Desde aquí puedes
        volver al inicio o consultar disponibilidad.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button href="/" variant="primary">
          Volver al inicio
        </Button>
        <Button href="/habitaciones" variant="outline">
          Ver habitaciones
        </Button>
      </div>
      <nav className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[12.5px] text-ink-3">
        {MAIN_NAV.map((i) => (
          <Link key={i.href} href={i.href} className="hover:text-carbon">
            {i.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
