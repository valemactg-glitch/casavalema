import Link from "next/link";
import { CONTACT, FOOTER_NAV, LEGAL_INFO, whatsappUrl } from "@/lib/nav";
import { Diamond } from "@/components/ui/Diamond";
import { BrandMark } from "./BrandLogo";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto bg-carbon text-marfil">
      <div className="shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-xs space-y-4">
          <div className="flex items-center gap-3">
            <BrandMark size={44} />
            <span className="inline-flex flex-col leading-none">
              <span className="font-heading text-[20px]">Valema</span>
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.26em] text-oro">
                Casa turística
              </span>
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-marfil/70">
            Cinco habitaciones independientes y un rooftop, en un barrio tranquilo.
            Reserva directo y habla con quien te va a recibir.
          </p>
          <div className="space-y-1.5 text-[13px] text-marfil/80">
            <p>
              <a href={CONTACT.telefonoHref} className="text-marfil/80 hover:text-oro">
                {CONTACT.telefono}
              </a>
            </p>
            <p>
              <a href={whatsappUrl()} className="text-marfil/80 hover:text-oro" rel="noopener">
                WhatsApp
              </a>
            </p>
            <p>
              <a href={`mailto:${CONTACT.correo}`} className="text-marfil/80 hover:text-oro">
                {CONTACT.correo}
              </a>
            </p>
            <p className="text-marfil/55">{CONTACT.horario}</p>
          </div>
        </div>

        {Object.entries(FOOTER_NAV).map(([grupo, items]) => (
          <nav key={grupo} aria-label={grupo} className="space-y-3">
            <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-oro">
              <Diamond className="size-[7px]" />
              {grupo}
            </p>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[13px] text-marfil/90 transition-colors hover:text-oro">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-marfil/15">
        <div className="shell flex flex-col gap-2 py-5 text-[11.5px] text-marfil/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {LEGAL_INFO.razonSocial} · {LEGAL_INFO.rnt} · {LEGAL_INFO.ciudad}
          </p>
          <div className="flex gap-4">
            <a href={CONTACT.instagramUrl} rel="noopener" className="hover:text-oro">
              Instagram
            </a>
            <Link href="/legales/politica-de-cookies" className="hover:text-oro">
              Cookies
            </Link>
            <Link href="/legales/terminos-y-condiciones" className="hover:text-oro">
              Términos
            </Link>
            <Link href="/admin" className="text-marfil/40 hover:text-oro">
              Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
