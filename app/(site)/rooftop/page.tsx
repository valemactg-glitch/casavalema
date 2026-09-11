import type { Metadata } from "next";
import { PageIntro, Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { Diamond } from "@/components/ui/Diamond";
import { Callout } from "@/components/ui/Callout";
import { getSitePage } from "@/lib/queries";
import { whatsappUrl } from "@/lib/nav";

// Datos en vivo (disponibilidad, precios, contenido editable): nunca prerenderizar.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rooftop",
  description:
    "El rooftop de Casa Turística Valema: mesas, hamacas y vista a los tejados del barrio. De uso libre para huéspedes, de 7:00 a 22:00.",
  alternates: { canonical: "/rooftop" },
};

export default async function RooftopPage() {
  const c = (await getSitePage("rooftop")) as {
    kicker?: string;
    titulo?: string;
    texto?: string;
    horario?: string;
    normas?: string[];
    futuro?: string;
  };

  return (
    <>
      <PageIntro
        kicker={c.kicker ?? "El rooftop"}
        title={c.titulo ?? "Donde termina el día"}
        intro={c.texto}
      />

      <Section>
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageSlot src="/foto4.png" alt="Rooftop al atardecer con pérgola de bugambilia, sillones de mimbre y vista al valle" ratio="16/9" className="rounded-lg sm:col-span-2" priority />
          <ImageSlot src="/foto1.png" alt="Desayuno servido en la terraza con vista a las montañas" ratio="4/3" className="rounded-md" />
          <ImageSlot alt="Vista de los tejados del barrio desde el rooftop" ratio="4/3" className="rounded-md" />
        </div>
      </Section>

      <Section tone="white">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading kicker="Cómo funciona" title="Un espacio compartido de la casa" />
            <dl className="mt-6 space-y-3 text-[13.5px]">
              <div className="flex justify-between border-b border-hairline pb-2.5">
                <dt className="text-ink-2">Horario</dt>
                <dd className="font-medium text-carbon">{c.horario ?? "Abierto de 7:00 a 22:00"}</dd>
              </div>
              <div className="flex justify-between border-b border-hairline pb-2.5">
                <dt className="text-ink-2">Costo</dt>
                <dd className="font-medium text-carbon">Sin costo para huéspedes</dd>
              </div>
              <div className="flex justify-between border-b border-hairline pb-2.5">
                <dt className="text-ink-2">Capacidad</dt>
                <dd className="font-medium text-carbon">Cómodo para 12 personas</dd>
              </div>
              <div className="flex justify-between border-b border-hairline pb-2.5">
                <dt className="text-ink-2">Acceso directo</dt>
                <dd className="font-medium text-carbon">Desde las habitaciones Alma y Aurora</dd>
              </div>
            </dl>
          </div>
          <div>
            <SectionHeading kicker="Normas de uso" title="Para que sea de todos" />
            <ul className="mt-6 space-y-3">
              {(c.normas ?? [
                "Uso compartido: cuida el volumen después de las 21:00.",
                "No se permite mover el mobiliario ni usarlo para eventos privados.",
                "Fumar está permitido solo aquí, en la zona señalizada.",
                "Los niños suben siempre acompañados de un adulto.",
              ]).map((n) => (
                <li key={n} className="flex gap-3 text-[13.5px] leading-relaxed text-ink-2">
                  <Diamond className="mt-1.5 size-[7px] shrink-0" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <Callout
          tone="info"
          title="Próximamente en el rooftop"
        >
          {c.futuro ??
            "Más adelante queremos ofrecer desayunos servidos, cenas de olla y pequeñas experiencias. Si te interesa, escríbenos y te avisamos cuando estén listas."}{" "}
          <a href={whatsappUrl("Hola, me interesa saber cuándo tendrán experiencias en el rooftop.")}>
            Avísenme
          </a>
        </Callout>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/reservar" variant="gold">
            Ver disponibilidad
          </Button>
          <Button href="/habitaciones" variant="outline">
            Ver habitaciones con acceso al rooftop
          </Button>
        </div>
      </Section>
    </>
  );
}
