import type { Metadata } from "next";
import { PageIntro, Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Diamond } from "@/components/ui/Diamond";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { getSitePage } from "@/lib/queries";
import { whatsappUrl } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Ubicación y cómo llegar",
  description:
    "Casa Turística Valema está en un barrio residencial y tranquilo, a pocos minutos del centro. La dirección exacta se comparte al confirmar la reserva.",
  alternates: { canonical: "/ubicacion" },
};

export default async function UbicacionPage() {
  const c = (await getSitePage("ubicacion")) as {
    kicker?: string;
    titulo?: string;
    sector?: string;
    distancias?: { lugar: string; detalle: string }[];
    recomendaciones?: string[];
  };

  return (
    <>
      <PageIntro
        kicker={c.kicker ?? "Cómo llegar"}
        title={c.titulo ?? "En un barrio tranquilo, cerca de todo lo que importa"}
        intro={c.sector}
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="relative overflow-hidden rounded-lg border border-hairline">
            <ImageSlot alt="Mapa del sector — sustituir por Google Maps embebido" ratio="16/10" />
            <div className="absolute inset-x-4 bottom-4 rounded-md bg-white/95 p-3 text-[12px] text-ink-2 shadow-card">
              El mapa muestra el sector aproximado. La ubicación exacta y el punto en el
              mapa se comparten al confirmar la reserva.
            </div>
          </div>
          <div>
            <SectionHeading kicker="Distancias" title="Qué tan cerca queda todo" />
            <dl className="mt-5 divide-y divide-hairline border-y border-hairline">
              {(c.distancias ?? []).map((d) => (
                <div key={d.lugar} className="flex items-center justify-between gap-4 py-2.5 text-[13px]">
                  <dt className="text-ink-2">{d.lugar}</dt>
                  <dd className="shrink-0 font-medium text-carbon">{d.detalle}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button href={whatsappUrl("Hola, tengo una duda sobre cómo llegar a Casa Valema.")} variant="outline" size="sm">
                Preguntar por WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="white">
        <SectionHeading kicker="Del barrio" title="Lo que recomendamos alrededor" />
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(c.recomendaciones ?? []).map((r) => (
            <li key={r} className="flex gap-3 rounded-lg border border-hairline bg-marfil p-4 text-[13px] leading-relaxed text-ink-2">
              <Diamond className="mt-1 size-[7px] shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <Callout tone="aviso" title="Sobre la dirección exacta">
          Por seguridad de la casa y de quienes se hospedan, compartimos la dirección
          completa, el acceso y el punto en el mapa una vez confirmada la reserva. Antes de
          reservar te indicamos el sector y las distancias, y resolvemos cualquier duda por
          WhatsApp.
        </Callout>
      </Section>
    </>
  );
}
