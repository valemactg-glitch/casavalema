import type { Metadata } from "next";
import { PageIntro, Section } from "@/components/site/Section";
import { Button } from "@/components/ui/Button";
import { FaqView } from "@/components/site/FaqView";
import { getFaq } from "@/lib/queries";
import { whatsappUrl } from "@/lib/nav";

// Datos en vivo (disponibilidad, precios, contenido editable): nunca prerenderizar.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Reservas, pagos, cancelaciones, llegada y salida, niños, mascotas, rooftop, ubicación y facturación en Casa Turística Valema.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

export default async function FaqPage() {
  const grupos = await getFaq();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: grupos.flatMap((g) =>
      g.items.map((i) => ({
        "@type": "Question",
        name: i.pregunta,
        acceptedAnswer: { "@type": "Answer", text: i.respuesta },
      })),
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageIntro
        kicker="Preguntas frecuentes"
        title="Todo lo que suelen preguntarnos"
        intro="Si no encuentras tu respuesta aquí, escríbenos: te contesta quien te va a recibir."
      />
      <Section>
        <FaqView
          grupos={grupos.map((g) => ({
            categoria: g.categoria,
            items: g.items.map((i) => ({ id: i.id, pregunta: i.pregunta, respuesta: i.respuesta })),
          }))}
        />
        <div className="mt-12 flex flex-wrap items-center gap-3 rounded-lg bg-carbon p-6 text-marfil">
          <p className="flex-1 text-[14px]">¿Tu pregunta no está? Escríbenos y te respondemos hoy mismo.</p>
          <Button href={whatsappUrl()} variant="gold">
            Preguntar por WhatsApp
          </Button>
          <Button href="/contacto" variant="outline" className="border-marfil/40 text-marfil hover:bg-marfil/10">
            Formulario de contacto
          </Button>
        </div>
      </Section>
    </>
  );
}
