import Link from "next/link";
import { Logo } from "@/components/site/Logo";
import { CONTACT, whatsappUrl } from "@/lib/nav";

export default function BookingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-hairline bg-marfil">
        <div className="shell flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4 text-[12px] text-ink-3">
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              Reserva segura
            </span>
            <a href={whatsappUrl()} className="hover:text-carbon">
              ¿Ayuda? WhatsApp
            </a>
          </div>
        </div>
      </header>

      <main id="contenido" className="flex-1 bg-marfil">
        <div className="shell py-8 sm:py-12">{children}</div>
      </main>

      <footer className="border-t border-hairline bg-marfil">
        <div className="shell flex flex-col gap-2 py-6 text-[11.5px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Casa Turística Valema</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-carbon">
              Volver al sitio
            </Link>
            <Link href="/legales/politica-de-reservas" className="hover:text-carbon">
              Política de reservas
            </Link>
            <Link href="/legales/politica-de-pagos" className="hover:text-carbon">
              Pagos
            </Link>
            <a href={`mailto:${CONTACT.correo}`} className="hover:text-carbon">
              {CONTACT.correo}
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
