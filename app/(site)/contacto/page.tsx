import type { Metadata } from "next";
import { PageIntro, Section } from "@/components/site/Section";
import { ContactForm } from "@/components/site/ContactForm";
import { Diamond } from "@/components/ui/Diamond";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { CONTACT, whatsappUrl } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos por formulario, WhatsApp, teléfono o correo. Te responde quien te va a recibir en Casa Turística Valema.",
  alternates: { canonical: "/contacto" },
};

export default function ContactoPage() {
  const vias = [
    { label: "WhatsApp", value: "Respuesta rápida", href: whatsappUrl() },
    { label: "Teléfono", value: CONTACT.telefono, href: CONTACT.telefonoHref },
    { label: "Correo", value: CONTACT.correo, href: `mailto:${CONTACT.correo}` },
    { label: "Instagram", value: `@${CONTACT.instagram}`, href: CONTACT.instagramUrl },
  ];

  return (
    <>
      <PageIntro
        kicker="Contacto"
        title="Hablas con la casa, no con un call center"
        intro="Cuéntanos qué necesitas y te respondemos hoy mismo. Para consultar disponibilidad y reservar, es más rápido usar el buscador."
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="rounded-lg border border-hairline bg-white p-6 sm:p-8">
            <ContactForm />
          </div>

          <aside className="space-y-6">
            <ul className="space-y-2">
              {vias.map((v) => (
                <li key={v.label}>
                  <a
                    href={v.href}
                    className="flex items-center justify-between rounded-lg border border-hairline bg-white px-4 py-3 hover:border-carbon"
                  >
                    <span className="flex items-center gap-2 text-[13px] font-medium text-carbon">
                      <Diamond className="size-[7px]" />
                      {v.label}
                    </span>
                    <span className="text-[12.5px] text-ink-3">{v.value}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="rounded-lg border border-hairline bg-marfil p-4 text-[12.5px] leading-relaxed text-ink-2">
              <p className="font-semibold text-carbon">Horario de atención</p>
              <p className="mt-1">{CONTACT.horario}</p>
            </div>
            <ImageSlot alt="Fachada de la casa" ratio="4/3" className="rounded-lg" />
          </aside>
        </div>
      </Section>
    </>
  );
}
