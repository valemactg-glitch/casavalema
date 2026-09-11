import type { Metadata } from "next";
import { PageIntro, Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { Diamond } from "@/components/ui/Diamond";
import { getSitePage } from "@/lib/queries";

// Datos en vivo (disponibilidad, precios, contenido editable): nunca prerenderizar.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "La casa",
  description:
    "La historia de Casa Turística Valema: una casa de familia convertida en alojamiento, con cinco habitaciones, patio y rooftop.",
  alternates: { canonical: "/la-casa" },
};

export default async function LaCasaPage() {
  const c = (await getSitePage("la-casa")) as {
    kicker?: string;
    titulo?: string;
    intro?: string;
    historia?: string;
    capacidad?: string;
  };

  const espacios = [
    { t: "El patio", d: "El centro de la casa. Bugambilia, una banca y sombra a mediodía. Se cruza para ir a cualquier parte." },
    { t: "La sala", d: "Sillones, una biblioteca que se puede usar y luz de tarde. Buena para leer o esperar el check-in." },
    { t: "El comedor", d: "Mesa larga de madera. Aquí se sirve el desayuno cuando lo pides y se arman las sobremesas." },
    { t: "El rooftop", d: "Arriba del todo: mesas, hamacas y los tejados del barrio. De uso libre, de 7:00 a 22:00." },
  ];

  const datos = [
    { k: "Capacidad total", v: c.capacidad ?? "Hasta 13 huéspedes en cinco habitaciones" },
    { k: "Check-in", v: "Desde las 15:00, con llegada coordinada" },
    { k: "Check-out", v: "Hasta las 11:00" },
    { k: "Anfitriona", v: "Marcela vive cerca y recibe personalmente a cada huésped" },
    { k: "Sector", v: "Residencial y tranquilo, con acceso controlado a la casa" },
    { k: "Idiomas", v: "Español e inglés básico" },
  ];

  return (
    <>
      <PageIntro
        kicker={c.kicker ?? "La casa · nuestra historia"}
        title={c.titulo ?? "Una casa de familia que aprendió a recibir"}
        intro={c.intro}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="space-y-4 text-[15px] leading-relaxed text-ink-2">
            {(c.historia ?? "").split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {!c.historia && (
              <p>
                Valema fue durante décadas la casa de una familia. Cuando quedó grande, en
                lugar de dividirla o venderla, decidimos abrirla.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ImageSlot alt="Fachada de la casa con la bugambilia" ratio="3/4" className="rounded-md" />
            <div className="grid gap-3">
              <ImageSlot alt="Zaguán de entrada con baldosa antigua" ratio="1/1" className="rounded-md" />
              <ImageSlot alt="Detalle de los techos altos" ratio="1/1" className="rounded-md" />
            </div>
          </div>
        </div>
      </Section>

      <Section tone="white">
        <SectionHeading kicker="Los espacios comunes" title="La casa por dentro" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {espacios.map((e) => (
            <div key={e.t} className="rounded-lg border border-hairline bg-marfil p-5">
              <div className="flex items-center gap-2">
                <Diamond className="size-[8px]" />
                <h3 className="text-[17px]">{e.t}</h3>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{e.d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading kicker="Datos prácticos" title="Lo que necesitas saber" />
            <dl className="mt-6 divide-y divide-hairline border-y border-hairline">
              {datos.map((d) => (
                <div key={d.k} className="grid gap-1 py-3 sm:grid-cols-[140px_1fr]">
                  <dt className="data-label pt-0.5">{d.k}</dt>
                  <dd className="text-[13.5px] text-ink-2">{d.v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-col justify-center gap-4 rounded-lg bg-carbon p-8 text-marfil">
            <p className="kicker !text-oro">¿Te animas?</p>
            <h2 className="text-[clamp(1.4rem,3vw,1.8rem)] text-marfil">
              Consulta disponibilidad y elige tu habitación
            </h2>
            <p className="text-[13px] leading-relaxed text-marfil/70">
              Precio y disponibilidad reales para las fechas que elijas. Reservar directo
              toma dos minutos.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button href="/reservar" variant="gold">
                Ver disponibilidad
              </Button>
              <Button
                href="/habitaciones"
                variant="outline"
                className="border-marfil/40 text-marfil hover:bg-marfil/10"
              >
                Ver habitaciones
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
