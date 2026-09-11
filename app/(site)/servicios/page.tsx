import type { Metadata } from "next";
import { PageIntro, Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Diamond } from "@/components/ui/Diamond";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { getServices } from "@/lib/queries";
import { cobroLabel } from "@/lib/booking/pricing";
import { formatCOP } from "@/lib/format";
import { amenidadLabel } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Servicios y experiencias",
  description:
    "Lo que incluye la tarifa y lo que puedes sumar a tu reserva en Casa Turística Valema: desayuno casero, traslados, check-in anticipado y más.",
  alternates: { canonical: "/servicios" },
};

const DISPONIBILIDAD: Record<string, { label: string; tone: "exito" | "info" | "aviso" | "neutro" }> = {
  INCLUIDO: { label: "Incluido", tone: "exito" },
  ADICIONAL: { label: "Adicional", tone: "info" },
  BAJO_SOLICITUD: { label: "Bajo solicitud", tone: "aviso" },
  NO_DISPONIBLE: { label: "No disponible", tone: "neutro" },
};

const INCLUIDO = [
  "wifi",
  "agua_caliente",
  "ropa_cama_algodon",
  "toallas",
  "amenities_bano",
  "acceso_rooftop",
];

export default async function ServiciosPage() {
  const servicios = await getServices();

  return (
    <>
      <PageIntro
        kicker="Servicios y experiencias"
        title="Lo que incluye la tarifa y lo que puedes sumar"
        intro="Todas las habitaciones vienen con lo esencial resuelto. Los servicios adicionales se agregan al reservar o desde 'Mi reserva'."
      />

      <Section>
        <SectionHeading kicker="Siempre incluido" title="En todas las habitaciones" />
        <div className="mt-6 flex flex-wrap gap-2.5">
          {INCLUIDO.map((k) => (
            <span
              key={k}
              className="inline-flex items-center gap-2 rounded-pill border border-hairline bg-white px-3.5 py-2 text-[12.5px] text-ink-2"
            >
              <Diamond className="size-[7px]" />
              {amenidadLabel(k)}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[12.5px] text-ink-3">
          Sin cargo por limpieza. Impuestos y cargos incluidos en el precio que ves.
        </p>
      </Section>

      <Section tone="white">
        <SectionHeading
          kicker="Para sumar a tu reserva"
          title="Servicios adicionales"
          intro="Cada servicio dice cómo se cobra y con cuánta anticipación pedirlo. Los de 'bajo solicitud' se confirman según disponibilidad."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {servicios.map((s) => {
            const d = DISPONIBILIDAD[s.disponibilidad] ?? DISPONIBILIDAD.ADICIONAL;
            return (
              <article key={s.id} className="flex gap-4 rounded-lg border border-hairline bg-marfil p-4">
                <ImageSlot
                  src={s.imagenUrl}
                  alt={`${s.nombre}`}
                  ratio="1/1"
                  className="w-24 shrink-0 rounded-md"
                />
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px]">{s.nombre}</h3>
                    <Badge tone={d.tone}>{d.label}</Badge>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-ink-2">{s.descripcion}</p>
                  <p className="text-[12.5px] text-ink-3">
                    {s.disponibilidad === "BAJO_SOLICITUD" && s.precio === 0 ? (
                      "Se cotiza según el caso"
                    ) : (
                      <>
                        <span className="font-semibold text-carbon">{formatCOP(s.precio)}</span>{" "}
                        {cobroLabel(s.tipoCobro)}
                      </>
                    )}
                    {s.cupo != null && ` · cupo diario para ${s.cupo}`}
                    {s.anticipacionHoras > 0 && ` · pídelo con ${s.anticipacionHoras} h de anticipación`}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      <Section>
        <div className="rounded-lg bg-carbon p-8 text-marfil">
          <p className="kicker !text-oro">Experiencias en el rooftop</p>
          <h2 className="mt-2 max-w-xl text-[clamp(1.4rem,3vw,1.9rem)] text-marfil">
            Desayunos servidos, cenas de olla y celebraciones pequeñas
          </h2>
          <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-marfil/70">
            Todavía no las ofrecemos de forma regular, pero las estamos preparando. Si
            viajas para una ocasión especial, escríbenos y vemos qué se puede armar.
          </p>
          <div className="mt-5">
            <Button href="/contacto" variant="gold">
              Escribir a la casa
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
